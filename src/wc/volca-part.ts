/**
 * <volca-part> — one drum part: two layers plus the part-level controls
 * (link, output, wave folder), a preset picker and a patch code.
 *
 * Web Component port of the React <Part> (src/components/Part/Part.tsx).
 * Second-tier composite: it nests <volca-layer> (itself a composite), so the
 * change pipeline now crosses two shadow boundaries — each level catches its
 * children's events and re-emits its own (composed: false keeps them from
 * leaking past a boundary uncaught).
 *
 *   - property in   el.value = PartState; el.presets = PartPreset[]
 *   - event out     'change' CustomEvent, detail: PartChange — the same
 *                   discriminated union React's onChange(change) took:
 *                   {kind:'part'|'layer'|'layer-replace'|'part-replace', …}
 *
 * Like React, the open/closed state of the <details> is uncontrolled.
 */

import './volca-layer';
import './volca-patch-code';
import './volca-scaled-slider';
import './volca-toggle';
import type { VolcaLayer, LayerChangeDetail } from './volca-layer';
import type { VolcaPatchCode } from './volca-patch-code';
import type { VolcaScaledSlider } from './volca-scaled-slider';
import type { VolcaToggle } from './volca-toggle';
import { matchPresetIndex } from '../lib/libraryMatch';
import { decodePart, encodePart } from '../lib/patchCodec';
import type { PartPreset } from '../lib/partLibrary';
import type { LayerState } from '../types/layer';
import { DEFAULT_PART, type PartChange, type PartState } from '../types/part';

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host { display: block; }
    .part__body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .part__comment {
      width: 100%;
      font-size: 0.875rem;
    }
    /* inner boxes (link row, output/wave-folder header) */
    .part__box {
      background: var(--_surface);
      border: 1px solid var(--_border-soft);
    }
    .part__header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.75rem 1rem;
    }
    .part__group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      /* wider label column for the group rows (toggle reads it through
         the shadow boundary via the custom property) */
      --volca-toggle-columns: 9rem 1fr 3rem;
    }
    .part__group .group-label { margin-bottom: 0.25rem; }
    .part__link {
      display: flex;
      justify-content: center;
      padding: 0.5rem;
      --volca-toggle-columns: auto auto auto;
      --volca-toggle-gap: 0.5rem;
    }
    .part__layers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
      gap: 0.75rem;
      --volca-layer-width: auto;
    }
  </style>
  <details class="part card" open>
    <summary class="part__title card-title"></summary>
    <div class="part__body">
      <label class="part__preset preset-row" hidden>
        <span class="group-label">Preset</span>
        <select class="part__preset-select control"></select>
      </label>
      <input type="text" class="part__comment control" placeholder="comment" aria-label="Part comment" />
      <volca-patch-code placeholder="vP1:..."></volca-patch-code>
      <div class="part__link part__box">
        <volca-toggle class="part__link-toggle" label="Link Layers"></volca-toggle>
      </div>
      <div class="part__layers">
        <volca-layer class="part__l1"></volca-layer>
        <volca-layer class="part__l2"></volca-layer>
      </div>
      <div class="part__header part__box">
        <div class="part__group">
          <h3 class="group-label">Output</h3>
          <volca-scaled-slider param="pan"></volca-scaled-slider>
          <volca-scaled-slider param="send"></volca-scaled-slider>
          <volca-toggle class="part__pq" label="Pitch Quantization"></volca-toggle>
        </div>
        <div class="part__group">
          <h3 class="group-label">Wave folder</h3>
          <volca-scaled-slider param="drive"></volca-scaled-slider>
          <volca-scaled-slider param="bitReduction"></volca-scaled-slider>
          <volca-scaled-slider param="fold"></volca-scaled-slider>
          <volca-scaled-slider param="dryGain"></volca-scaled-slider>
        </div>
      </div>
    </div>
  </details>
`;

type ScaledPartParam = 'pan' | 'send' | 'drive' | 'bitReduction' | 'fold' | 'dryGain';

export class VolcaPart extends HTMLElement {
  static observedAttributes = ['label', 'name', 'disabled'];

  #title: HTMLElement;
  #presetRow: HTMLElement;
  #presetSelect: HTMLSelectElement;
  #comment: HTMLInputElement;
  #patchCode: VolcaPatchCode;
  #linkToggle: VolcaToggle;
  #pqToggle: VolcaToggle;
  #layer1: VolcaLayer;
  #layer2: VolcaLayer;
  #scaled: Map<ScaledPartParam, VolcaScaledSlider>;
  #value: PartState = DEFAULT_PART;
  #presets: PartPreset[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    // see volca-layer: template-cloned custom children must be upgraded
    // before the constructor/pre-connect callbacks set properties on them
    customElements.upgrade(root);
    this.#title = root.querySelector<HTMLElement>('.part__title')!;
    this.#presetRow = root.querySelector<HTMLElement>('.part__preset')!;
    this.#presetSelect = root.querySelector<HTMLSelectElement>('.part__preset-select')!;
    this.#comment = root.querySelector<HTMLInputElement>('.part__comment')!;
    this.#patchCode = root.querySelector<VolcaPatchCode>('volca-patch-code')!;
    this.#linkToggle = root.querySelector<VolcaToggle>('.part__link-toggle')!;
    this.#pqToggle = root.querySelector<VolcaToggle>('.part__pq')!;
    this.#layer1 = root.querySelector<VolcaLayer>('.part__l1')!;
    this.#layer2 = root.querySelector<VolcaLayer>('.part__l2')!;
    this.#scaled = new Map(
      [...root.querySelectorAll<VolcaScaledSlider>('volca-scaled-slider')].map(
        (el) => [el.param as ScaledPartParam, el],
      ),
    );

    this.#presetSelect.addEventListener('change', () => {
      const preset = this.#presets[Number(this.#presetSelect.value)];
      // Reset to the placeholder; the derived match in #sync lights the
      // picked entry back up once the new value actually arrives.
      this.#presetSelect.value = '';
      if (preset) this.#emit({ kind: 'part-replace', value: preset.part });
    });

    this.#comment.addEventListener('input', () => {
      this.#emit({ kind: 'part', param: 'comment', value: this.#comment.value });
    });

    this.#patchCode.addEventListener('apply', (e) => {
      const parsed = decodePart((e as CustomEvent<string>).detail);
      if (!parsed) {
        e.preventDefault();
        return;
      }
      this.#emit({ kind: 'part-replace', value: parsed });
    });

    this.#linkToggle.addEventListener('change', (e) => {
      this.#emit({ kind: 'part', param: 'linked', value: (e as CustomEvent<boolean>).detail });
    });
    this.#pqToggle.addEventListener('change', (e) => {
      this.#emit({ kind: 'part', param: 'pitchQuant', value: (e as CustomEvent<boolean>).detail });
    });

    for (const [slot, layer] of [[1, this.#layer1], [2, this.#layer2]] as const) {
      layer.addEventListener('change', (e) => {
        const { param, value } = (e as CustomEvent<LayerChangeDetail>).detail;
        this.#emit({ kind: 'layer', slot, param, value });
      });
      layer.addEventListener('replace', (e) => {
        this.#emit({ kind: 'layer-replace', slot, value: (e as CustomEvent<LayerState>).detail });
      });
    }

    for (const [param, slider] of this.#scaled) {
      slider.addEventListener('change', (e) => {
        this.#emit({ kind: 'part', param, value: (e as CustomEvent<number>).detail });
      });
    }
  }

  connectedCallback(): void {
    this.#sync();
  }

  attributeChangedCallback(): void {
    this.#sync();
  }

  get value(): PartState {
    return this.#value;
  }
  set value(v: PartState) {
    this.#value = v;
    this.#sync();
  }

  get presets(): PartPreset[] {
    return this.#presets;
  }
  set presets(v: PartPreset[]) {
    this.#presets = v ?? [];
    this.#renderPresets();
    this.#syncPresetSelection();
  }

  get label(): string {
    return this.getAttribute('label') ?? 'Part';
  }
  set label(v: string) {
    if (v === this.label) return;
    this.setAttribute('label', v);
  }

  get name(): string {
    return this.getAttribute('name') ?? 'part';
  }
  set name(v: string) {
    if (v === this.name) return;
    this.setAttribute('name', v);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #emit(change: PartChange): void {
    this.dispatchEvent(
      new CustomEvent<PartChange>('change', { detail: change, bubbles: true }),
    );
  }

  #renderPresets(): void {
    this.#presetRow.hidden = this.#presets.length === 0;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.textContent = 'Choose a preset…';
    this.#presetSelect.replaceChildren(
      placeholder,
      ...this.#presets.map((preset, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = preset.name;
        return opt;
      }),
    );
    this.#presetSelect.value = '';
  }

  // Derived, not remembered: show the preset the part currently equals.
  #syncPresetSelection(): void {
    const i = matchPresetIndex(this.#presets, this.#value);
    this.#presetSelect.value = i === -1 ? '' : String(i);
  }

  #sync(): void {
    const v = this.#value;
    const disabled = this.disabled;
    const label = this.label;
    const name = this.name;

    this.#title.textContent = v.comment ? `${label} — ${v.comment}` : label;

    if (this.#comment.value !== v.comment) this.#comment.value = v.comment;
    this.#comment.disabled = disabled;

    this.#patchCode.value = encodePart(v);
    this.#patchCode.disabled = disabled;
    this.#presetSelect.disabled = disabled;
    this.#syncPresetSelection();

    this.#linkToggle.checked = v.linked;
    this.#linkToggle.disabled = disabled;

    this.#layer1.label = v.linked ? 'Layer 1-2' : 'Layer 1';
    this.#layer1.context = label;
    this.#layer1.name = `${name}-l1`;
    this.#layer1.pitchQuant = v.pitchQuant;
    this.#layer1.disabled = disabled;
    this.#layer1.value = v.layer1;

    this.#layer2.label = 'Layer 2';
    this.#layer2.context = label;
    this.#layer2.name = `${name}-l2`;
    this.#layer2.pitchQuant = v.pitchQuant;
    this.#layer2.disabled = disabled || v.linked;
    this.#layer2.value = v.layer2;

    for (const [param, slider] of this.#scaled) {
      slider.cc = v[param];
      slider.disabled = disabled;
    }

    this.#pqToggle.checked = v.pitchQuant;
    this.#pqToggle.disabled = disabled;
  }
}

customElements.define('volca-part', VolcaPart);

declare global {
  interface HTMLElementTagNameMap {
    'volca-part': VolcaPart;
  }
}
