/**
 * <volca-slider> — a labelled range slider paired with a number box.
 *
 * Web Component port of the React <Slider> (src/components/controls/Slider.tsx).
 * Conventions from MIGRATION.md:
 *
 *   - property in   el.value = 64 / el.min = 0 / el.label = 'Level'
 *   - event out     'change' CustomEvent, detail: number
 *   - a11y          two controls can't share one wrapping <label>, so both
 *                   inputs use aria-labelledby → the label span (ids resolve
 *                   within a single shadow root)
 *
 * The number box is draft-state + commit-on-blur: while you type, nothing
 * upstream changes, so the typed text is preserved untouched. We only rewrite
 * the box when `value` actually changes — a range drag, an external set, or a
 * commit (which clamps + rounds). That replaces React's render-phase
 * `if (value !== lastValue) setDraft(...)` trick.
 *
 * Like a native <input>, the `value` attribute is only the *initial* value;
 * the live value lives on the property and is not reflected back (so dragging
 * doesn't churn an attribute on every pixel).
 */

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host {
      display: block;
      font-family: var(--_font-ui);
      font-size: 0.875rem;
    }
    .slider__row {
      display: grid;
      grid-template-columns: 6rem 1fr 3rem;
      align-items: center;
      gap: 0.5rem;
    }
    .slider__label {
      font-weight: 500;
    }
    .slider__range {
      width: 100%;
    }
    .slider__value {
      width: 3rem;
      text-align: right;
      font-variant-numeric: tabular-nums;
      padding: 0.125rem 0.25rem;
    }
    .slider__below {
      margin-top: 0.25rem;
      display: grid;
      grid-template-columns: 6rem auto;
      gap: 0.5rem;
      align-items: center;
    }
    /* must beat the display:grid above (equal specificity — later wins) */
    .slider__below[hidden] { display: none; }
  </style>
  <div class="slider__row">
    <span class="slider__label" id="label"></span>
    <input type="range" class="slider__range" aria-labelledby="label" />
    <input type="number" class="slider__value control" aria-labelledby="label" />
  </div>
  <div class="slider__below" hidden>
    <span class="slider__label" id="below-label"></span>
    <slot name="below"></slot>
  </div>
`;

export class VolcaSlider extends HTMLElement {
  static observedAttributes = ['value', 'label', 'min', 'max', 'step', 'disabled', 'below-label'];

  #range: HTMLInputElement;
  #number: HTMLInputElement;
  #labelEl: HTMLElement;
  #belowRow: HTMLElement;
  #belowLabelEl: HTMLElement;
  #value = 0;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#range = root.querySelector<HTMLInputElement>('.slider__range')!;
    this.#number = root.querySelector<HTMLInputElement>('.slider__value')!;
    this.#labelEl = root.querySelector<HTMLElement>('#label')!;
    this.#belowRow = root.querySelector<HTMLElement>('.slider__below')!;
    this.#belowLabelEl = root.querySelector<HTMLElement>('#below-label')!;

    // The "below" row (React's below/belowLabel props, e.g. the pitch
    // picker's Note row) is a named slot; it shows only when light-DOM
    // content is actually slotted in.
    const slot = root.querySelector<HTMLSlotElement>('slot[name="below"]')!;
    slot.addEventListener('slotchange', () => {
      this.#belowRow.hidden = slot.assignedElements().length === 0;
    });

    // Range: every step during a drag is a live edit — set value and emit.
    this.#range.addEventListener('input', () => {
      this.value = Number(this.#range.value);
      this.#emit();
    });

    // Number: no input handler — the box holds the draft itself while typing.
    // Commit on blur; Enter commits, Escape reverts.
    this.#number.addEventListener('blur', () => this.#commit());
    this.#number.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.#number.blur();
      } else if (e.key === 'Escape') {
        this.#number.value = String(this.#value);
        this.#number.blur();
      }
    });
  }

  connectedCallback(): void {
    this.#renderConfig();
    this.#syncValue();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'value') {
      if (value !== null) this.value = Number(value);
    } else {
      this.#renderConfig();
    }
  }

  get value(): number {
    return this.#value;
  }
  set value(v: number) {
    const next = Number(v);
    if (next === this.#value) return;
    this.#value = next;
    this.#syncValue();
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }
  set label(v: string) {
    this.setAttribute('label', v ?? '');
  }

  get min(): number {
    return this.#numAttr('min', 0);
  }
  set min(v: number) {
    this.setAttribute('min', String(v));
  }

  get max(): number {
    return this.#numAttr('max', 127);
  }
  set max(v: number) {
    this.setAttribute('max', String(v));
  }

  get step(): number {
    return this.#numAttr('step', 1);
  }
  set step(v: number) {
    this.setAttribute('step', String(v));
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #numAttr(name: string, fallback: number): number {
    const raw = this.getAttribute(name);
    if (raw === null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  // Commit the number box: clamp + round like the range would, emit, then
  // always resync the display to canonical (covers invalid or no-op input,
  // e.g. typing "063" settles back to "63").
  #commit(): void {
    const raw = this.#number.value;
    const n = Number(raw);
    if (raw !== '' && Number.isFinite(n)) {
      this.value = Math.min(this.max, Math.max(this.min, Math.round(n)));
      this.#emit();
    }
    this.#number.value = String(this.#value);
  }

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.#value, bubbles: true }),
    );
  }

  // Config (label, bounds, disabled) — never touches the number box's text.
  #renderConfig(): void {
    this.#labelEl.textContent = this.label;
    this.#belowLabelEl.textContent = this.getAttribute('below-label') ?? '';
    const min = String(this.min);
    const max = String(this.max);
    const step = String(this.step);
    for (const input of [this.#range, this.#number]) {
      input.min = min;
      input.max = max;
      input.step = step;
      input.disabled = this.disabled;
    }
  }

  // The only place that rewrites the number box — called when `value` itself
  // changes, never while merely typing.
  #syncValue(): void {
    const v = String(this.#value);
    this.#range.value = v;
    this.#number.value = v;
  }
}

customElements.define('volca-slider', VolcaSlider);

declare global {
  interface HTMLElementTagNameMap {
    'volca-slider': VolcaSlider;
  }
}
