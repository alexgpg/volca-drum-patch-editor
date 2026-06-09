/**
 * <volca-scaled-slider> — a <volca-slider> that speaks MIDI CC on the outside
 * and device-LCD units on the inside.
 *
 * Web Component port of the React <ScaledSlider>
 * (src/components/controls/ScaledSlider.tsx). It exists for the same reason:
 * to encapsulate the CC↔LCD mapping (lib/deviceScale) so parents deal only in
 * CC values.
 *
 *   - property in   el.param = 'level' / el.cc = 100
 *   - event out     'change' CustomEvent, detail: number (a MIDI CC, 0..127)
 *
 * Composition note: the inner slider lives in this element's shadow root and
 * emits its own `change` (an LCD value). That event is `composed: false`, so
 * it stops at the shadow boundary — we catch it here, snap LCD → CC, and
 * re-emit a CC-valued `change`. Parents never see the inner LCD event.
 */

import { ccToLcd, lcdToCcSnap, lcdRange, type ScaledParam } from '../lib/deviceScale';
import './volca-slider';
import type { VolcaSlider } from './volca-slider';

// Mirrors the map in ScaledSlider.tsx. Hoist to lib/ when the React copy goes.
const PARAM_LABEL: Record<ScaledParam, string> = {
  level: 'Level',
  egAttack: 'EG Attack',
  egRelease: 'EG Release',
  modAmount: 'Mod Amount',
  modRate: 'Mod Rate',
  pan: 'Pan',
  send: 'Send',
  drive: 'Drive',
  bitReduction: 'Bit Reduction',
  fold: 'Fold',
  dryGain: 'Dry Gain',
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
  </style>
  <volca-slider></volca-slider>
`;

export class VolcaScaledSlider extends HTMLElement {
  static observedAttributes = ['param', 'cc', 'disabled'];

  #slider: VolcaSlider;
  #cc = 0;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    // Upgrade the template-cloned inner slider now: #render() may run from
    // attributeChangedCallback before connection (e.g. parser-set `param`),
    // and property sets on an un-upgraded element shadow its accessors.
    customElements.upgrade(root);
    this.#slider = root.querySelector('volca-slider')!;

    // Inner LCD change → snap to the nearest CC, re-emit as a CC change.
    this.#slider.addEventListener('change', (e) => {
      const param = this.param;
      if (!param) return;
      const lcd = (e as CustomEvent<number>).detail;
      this.cc = lcdToCcSnap(param, lcd); // updates #cc + resyncs the display
      this.#emit();
    });
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'cc' && value !== null) this.#cc = Number(value);
    this.#render();
  }

  get cc(): number {
    return this.#cc;
  }
  // No equality short-circuit: always resync the inner display. After a snap,
  // the CC can be unchanged while the LCD the user dragged to still needs to
  // jump to the nearest valid step.
  set cc(v: number) {
    this.#cc = Number(v);
    this.#render();
  }

  get param(): ScaledParam | '' {
    return (this.getAttribute('param') ?? '') as ScaledParam | '';
  }
  set param(v: ScaledParam) {
    this.setAttribute('param', v);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.#cc, bubbles: true }),
    );
  }

  // Push the CC-derived view onto the inner slider: label + LCD range + the
  // converted value. Property-based composition — no inner markup to touch.
  #render(): void {
    const param = this.param;
    if (!param) return;
    const { min, max, step } = lcdRange(param);
    this.#slider.label = PARAM_LABEL[param];
    this.#slider.min = min;
    this.#slider.max = max;
    this.#slider.step = step;
    this.#slider.value = ccToLcd(param, this.#cc);
    this.#slider.disabled = this.disabled;
  }
}

customElements.define('volca-scaled-slider', VolcaScaledSlider);

declare global {
  interface HTMLElementTagNameMap {
    'volca-scaled-slider': VolcaScaledSlider;
  }
}
