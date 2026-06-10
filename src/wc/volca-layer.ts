/**
 * <volca-layer> — one oscillator layer: sound source, mod, EG and sliders.
 *
 * Web Component port of the React <Layer> (src/components/Layer/Layer.tsx),
 * and the first *composite* element: a static template of already-ported
 * leaves (<volca-icon-radio-group>, <volca-scaled-slider>, <volca-slider>,
 * <volca-pitch-picker>, <volca-patch-code>) wired once in the constructor,
 * with a single #sync() pushing state down. No dynamic lists — composition
 * stays declarative.
 *
 *   - property in   el.value = LayerState (object → property, never attribute)
 *   - events out    'change'  CustomEvent, detail: { param, value }
 *                   (mirrors React's onChange(param, value))
 *                   'replace' CustomEvent, detail: LayerState
 *                   (a decoded patch-code paste; parent applies it)
 *
 * React's `below`/`belowLabel` ReactNode props become light-DOM slotting:
 * the pitch picker is slotted into the Pitch slider's "below" slot. One
 * consequence: the slotted picker is a DOM *child* of the slider, so its
 * bubbling `change` passes through the slider element — the slider's own
 * listener must guard on e.target or it hears both.
 */

import './volca-icon-radio-group';
import './volca-patch-code';
import './volca-pitch-picker';
import './volca-scaled-slider';
import './volca-slider';
import type { VolcaIconRadioGroup } from './volca-icon-radio-group';
import type { VolcaPatchCode } from './volca-patch-code';
import type { VolcaPitchPicker } from './volca-pitch-picker';
import type { VolcaScaledSlider } from './volca-scaled-slider';
import type { VolcaSlider } from './volca-slider';
import { ccToDisplayPitch, displayPitchToCcSnap } from '../lib/devicePitch';
import { decodeLayer, encodeLayer } from '../lib/patchCodec';
import { DEFAULT_LAYER, type LayerState } from '../types/layer';

export interface LayerChangeDetail<K extends keyof LayerState = keyof LayerState> {
  param: K;
  value: LayerState[K];
}

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host { display: block; }
    .layer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      /* Width is themable from outside (custom properties pierce the shadow
         boundary); <volca-part> sets it to auto in its responsive grid. */
      width: var(--volca-layer-width, 22rem);
    }
    .layer__title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .layer__comment {
      width: 100%;
      padding: 0.25rem 0.5rem;
      font-size: 0.8125rem;
    }
    .layer__radios {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .layer__sliders {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  </style>
  <section class="layer card card--soft">
    <h3 class="layer__title"></h3>
    <input type="text" class="layer__comment control" placeholder="comment" aria-label="Layer comment" />
    <volca-patch-code placeholder="vL1:..."></volca-patch-code>
    <div class="layer__radios">
      <volca-icon-radio-group data-param="soundSource" label="Sound Source"></volca-icon-radio-group>
      <volca-icon-radio-group data-param="modType" label="Mod Type"></volca-icon-radio-group>
      <volca-icon-radio-group data-param="ampEG" label="Amp EG"></volca-icon-radio-group>
    </div>
    <div class="layer__sliders">
      <volca-scaled-slider param="level"></volca-scaled-slider>
      <volca-slider class="layer__pitch" label="Pitch" min="0" max="255" step="2" below-label="Note">
        <volca-pitch-picker slot="below"></volca-pitch-picker>
      </volca-slider>
      <volca-scaled-slider param="modAmount"></volca-scaled-slider>
      <volca-scaled-slider param="modRate"></volca-scaled-slider>
      <volca-scaled-slider param="egAttack"></volca-scaled-slider>
      <volca-scaled-slider param="egRelease"></volca-scaled-slider>
    </div>
  </section>
`;

const RADIO_OPTIONS = {
  soundSource: [
    { value: 'sine', label: 'Sine' },
    { value: 'saw', label: 'Saw' },
    { value: 'noiseHP', label: 'HP' },
    { value: 'noiseLP', label: 'LP' },
    { value: 'noiseBP', label: 'BP' },
  ],
  modType: [
    { value: 'envelope', label: 'Env' },
    { value: 'lfo', label: 'LFO' },
    { value: 'random', label: 'Rnd' },
  ],
  ampEG: [
    { value: 'ad', label: 'AD' },
    { value: 'exp', label: 'Exp' },
    { value: 'multi', label: 'Multi' },
  ],
} as const;

type RadioParam = keyof typeof RADIO_OPTIONS;
type ScaledLayerParam = 'level' | 'modAmount' | 'modRate' | 'egAttack' | 'egRelease';

export class VolcaLayer extends HTMLElement {
  static observedAttributes = ['label', 'name', 'disabled', 'pitch-quant', 'context'];

  #section: HTMLElement;
  #title: HTMLElement;
  #comment: HTMLInputElement;
  #patchCode: VolcaPatchCode;
  #radios: Map<RadioParam, VolcaIconRadioGroup>;
  #scaled: Map<ScaledLayerParam, VolcaScaledSlider>;
  #pitchSlider: VolcaSlider;
  #pitchPicker: VolcaPitchPicker;
  #value: LayerState = DEFAULT_LAYER;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    // Template-cloned custom children are NOT upgraded while the host is
    // detached — property sets below would land on un-upgraded elements and
    // shadow the class accessors forever. Upgrade the subtree explicitly.
    customElements.upgrade(root);
    this.#section = root.querySelector<HTMLElement>('.layer')!;
    this.#title = root.querySelector<HTMLElement>('.layer__title')!;
    this.#comment = root.querySelector<HTMLInputElement>('.layer__comment')!;
    this.#patchCode = root.querySelector<VolcaPatchCode>('volca-patch-code')!;
    this.#pitchSlider = root.querySelector<VolcaSlider>('.layer__pitch')!;
    this.#pitchPicker = root.querySelector<VolcaPitchPicker>('volca-pitch-picker')!;

    this.#radios = new Map(
      [...root.querySelectorAll<VolcaIconRadioGroup>('volca-icon-radio-group')].map(
        (el) => [el.dataset.param as RadioParam, el],
      ),
    );
    this.#scaled = new Map(
      [...root.querySelectorAll<VolcaScaledSlider>('volca-scaled-slider')].map(
        (el) => [el.param as ScaledLayerParam, el],
      ),
    );

    this.#comment.addEventListener('input', () => {
      this.#emitChange('comment', this.#comment.value);
    });

    // Cancelable apply: reject undecodable codes; good ones become 'replace'.
    this.#patchCode.addEventListener('apply', (e) => {
      const parsed = decodeLayer((e as CustomEvent<string>).detail);
      if (!parsed) {
        e.preventDefault();
        return;
      }
      this.dispatchEvent(
        new CustomEvent('replace', { detail: parsed, bubbles: true }),
      );
    });

    for (const [param, radio] of this.#radios) {
      radio.options = [...RADIO_OPTIONS[param]];
      radio.addEventListener('change', (e) => {
        this.#emitChange(param, (e as CustomEvent<string>).detail as LayerState[RadioParam]);
      });
    }

    for (const [param, slider] of this.#scaled) {
      slider.addEventListener('change', (e) => {
        this.#emitChange(param, (e as CustomEvent<number>).detail);
      });
    }

    // The slotted picker is a light-DOM child of the slider, so its bubbling
    // 'change' (a CC) passes through the slider element too — without the
    // target guard this listener would treat it as a display-pitch value.
    this.#pitchSlider.addEventListener('change', (e) => {
      if (e.target !== this.#pitchSlider) return;
      this.#emitChange('pitch', displayPitchToCcSnap((e as CustomEvent<number>).detail));
    });
    this.#pitchPicker.addEventListener('change', (e) => {
      this.#emitChange('pitch', (e as CustomEvent<number>).detail);
    });
  }

  connectedCallback(): void {
    this.#sync();
  }

  attributeChangedCallback(): void {
    this.#sync();
  }

  get value(): LayerState {
    return this.#value;
  }
  set value(v: LayerState) {
    this.#value = v;
    this.#sync();
  }

  // Same-value guards: a no-op setAttribute still fires
  // attributeChangedCallback → #sync, so parent echoes would cascade.
  get label(): string {
    return this.getAttribute('label') ?? 'Layer';
  }
  set label(v: string) {
    if (v === this.label) return;
    this.setAttribute('label', v);
  }

  get name(): string {
    return this.getAttribute('name') ?? 'layer';
  }
  set name(v: string) {
    if (v === this.name) return;
    this.setAttribute('name', v);
  }

  /**
   * Naming context for the section landmark, e.g. the owning part's label.
   * Six parts each contain a "Layer 1"/"Layer 2" region; without context the
   * landmark list is twelve indistinguishable entries (axe landmark-unique).
   * The visible heading stays short — only the accessible name is prefixed.
   * (Deliberately not named aria-*: unknown aria attributes are invalid.)
   */
  get context(): string {
    return this.getAttribute('context') ?? '';
  }
  set context(v: string) {
    if ((v ?? '') === this.context) return;
    this.setAttribute('context', v ?? '');
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  get pitchQuant(): boolean {
    return this.hasAttribute('pitch-quant');
  }
  set pitchQuant(v: boolean) {
    this.toggleAttribute('pitch-quant', Boolean(v));
  }

  #emitChange<K extends keyof LayerState>(param: K, value: LayerState[K]): void {
    this.dispatchEvent(
      new CustomEvent<LayerChangeDetail<K>>('change', {
        detail: { param, value },
        bubbles: true,
      }),
    );
  }

  #sync(): void {
    const v = this.#value;
    const disabled = this.disabled;
    const label = this.label;
    const name = this.name;

    const context = this.context;
    this.#section.setAttribute('aria-label', context ? `${context} — ${label}` : label);
    this.#title.textContent = v.comment ? `${label} — ${v.comment}` : label;

    // Same-string writes are skipped so the caret survives the parent echoing
    // each keystroke back through `value`.
    if (this.#comment.value !== v.comment) this.#comment.value = v.comment;
    this.#comment.disabled = disabled;

    this.#patchCode.value = encodeLayer(v);
    this.#patchCode.disabled = disabled;

    const radioName: Record<RadioParam, string> = {
      soundSource: `${name}-source`,
      modType: `${name}-mod`,
      ampEG: `${name}-env`,
    };
    for (const [param, radio] of this.#radios) {
      radio.name = radioName[param];
      radio.value = v[param];
      radio.disabled = disabled;
    }

    for (const [param, slider] of this.#scaled) {
      slider.cc = v[param];
      slider.disabled = disabled;
    }

    this.#pitchSlider.value = ccToDisplayPitch(v.pitch);
    this.#pitchSlider.disabled = disabled;
    this.#pitchPicker.value = v.pitch;
    this.#pitchPicker.disabled = disabled || !this.pitchQuant;
  }
}

customElements.define('volca-layer', VolcaLayer);

declare global {
  interface HTMLElementTagNameMap {
    'volca-layer': VolcaLayer;
  }
}
