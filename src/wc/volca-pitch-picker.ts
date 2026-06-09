/**
 * <volca-pitch-picker> — a note combobox with −/+ steppers and a 128-note
 * popover listbox.
 *
 * Web Component port of the React <PitchPicker>
 * (src/components/controls/PitchPicker.tsx). The most involved leaf: a popover,
 * draft-state, click-outside dismissal, and a dynamic option list.
 *
 *   - property in   el.value = 64   (a MIDI CC, 0..127)
 *   - event out     'change' CustomEvent, detail: number (a CC)
 *
 * Platform wins over the React version:
 *   - click-outside via composedPath().includes(this), no ref juggling;
 *   - the listbox id is fixed — shadow DOM scopes ids, so no useId and no
 *     cross-instance collision;
 *   - Escape reverts cleanly: we set the input value synchronously, so the
 *     blur-driven commit sees the canonical label and no-ops (no skip flag).
 *
 * a11y: the combobox input gets an aria-label the React version lacked.
 */

import { ccToDisplayPitch, displayPitchToCc } from '../lib/devicePitch';
import { labelToPitch, pitchToLabel } from '../lib/devicePitchLabels';

const MIN = 0;
const MAX = 127;

const ALL_LABELS: string[] = Array.from({ length: 128 }, (_, cc) =>
  pitchToLabel(ccToDisplayPitch(cc)),
);

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: inline-block; }
    .pitch-picker {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .pitch-picker__btn {
      flex: 0 0 auto;
      padding: 0;
      border: 1px solid #ccc;
      background: #fafafa;
      font-family: inherit;
      color: #333;
      cursor: pointer;
    }
    .pitch-picker__btn:hover:not(:disabled) { background: #f0f0f0; }
    .pitch-picker__btn:disabled {
      background: #f0f0f0;
      color: #888;
      cursor: not-allowed;
    }
    .pitch-picker__step {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      line-height: 1;
    }
    .pitch-picker__step:focus-visible {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
    }
    .pitch-picker__field {
      position: relative;
      display: inline-flex;
      align-items: stretch;
    }
    .pitch-picker__input {
      width: 4rem;
      box-sizing: border-box;
      padding: 0.125rem 0.375rem;
      border: 1px solid #ccc;
      border-right: none;
      border-radius: 4px 0 0 4px;
      background: #fff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      color: #333;
    }
    .pitch-picker__input:focus {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
      border-color: #2b6cb0;
      position: relative;
      z-index: 1;
    }
    .pitch-picker__input--invalid { border-color: #c53030; }
    .pitch-picker__input--invalid:focus {
      outline-color: #c53030;
      border-color: #c53030;
    }
    .pitch-picker__input:disabled {
      background: #f0f0f0;
      color: #888;
    }
    .pitch-picker__open {
      width: 1.25rem;
      border-radius: 0 4px 4px 0;
      font-size: 0.75rem;
    }
    .pitch-picker__popover {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.25rem;
      z-index: 10;
      display: flex;
      flex-direction: column;
      max-height: 16rem;
      overflow-y: auto;
      scrollbar-gutter: stable;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.8125rem;
    }
    /* hidden must beat the display:flex above (equal specificity → later wins) */
    .pitch-picker__popover[hidden] { display: none; }
    .pitch-picker__option {
      flex: 0 0 auto;
      padding: 0.25rem 0.75rem;
      border: none;
      background: #fff;
      text-align: left;
      color: #333;
      cursor: pointer;
      white-space: nowrap;
    }
    .pitch-picker__option:hover { background: #ebf2fa; }
    .pitch-picker__option.is-selected {
      background: #2b6cb0;
      color: #fff;
    }
  </style>
  <div class="pitch-picker">
    <button type="button" class="pitch-picker__btn pitch-picker__step" data-step="-1"
      aria-label="One semitone down">−</button>
    <div class="pitch-picker__field">
      <input type="text" class="pitch-picker__input" role="combobox" aria-expanded="false"
        aria-controls="pitch-listbox" aria-autocomplete="list" aria-label="Pitch"
        spellcheck="false" autocorrect="off" autocapitalize="off" />
      <button type="button" class="pitch-picker__btn pitch-picker__open"
        aria-label="Open note picker" aria-haspopup="listbox" tabindex="-1">▾</button>
      <div id="pitch-listbox" class="pitch-picker__popover" role="listbox" aria-label="Notes" hidden></div>
    </div>
    <button type="button" class="pitch-picker__btn pitch-picker__step" data-step="1"
      aria-label="One semitone up">+</button>
  </div>
`;

export class VolcaPitchPicker extends HTMLElement {
  static observedAttributes = ['value', 'disabled'];

  #minusBtn: HTMLButtonElement;
  #plusBtn: HTMLButtonElement;
  #openBtn: HTMLButtonElement;
  #input: HTMLInputElement;
  #popover: HTMLElement;
  #value = 0;
  #open = false;

  // Bound once so add/removeEventListener pair up. Closes on any click whose
  // composed path doesn't pass through this element.
  #onDocMouseDown = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) this.#setOpen(false);
  };

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#minusBtn = root.querySelector<HTMLButtonElement>('[data-step="-1"]')!;
    this.#plusBtn = root.querySelector<HTMLButtonElement>('[data-step="1"]')!;
    this.#openBtn = root.querySelector<HTMLButtonElement>('.pitch-picker__open')!;
    this.#input = root.querySelector<HTMLInputElement>('.pitch-picker__input')!;
    this.#popover = root.querySelector<HTMLElement>('.pitch-picker__popover')!;
    this.#buildOptions();

    this.#minusBtn.addEventListener('click', () => this.#step(-1));
    this.#plusBtn.addEventListener('click', () => this.#step(1));
    this.#openBtn.addEventListener('click', () => this.#setOpen(!this.#open));
    this.#input.addEventListener('blur', () => this.#commit());
    this.#input.addEventListener('keydown', (e) => this.#onInputKeyDown(e));
    this.#popover.addEventListener('click', (e) => {
      const opt = (e.target as HTMLElement).closest<HTMLButtonElement>('.pitch-picker__option');
      if (opt && opt.dataset.cc !== undefined) this.#pick(Number(opt.dataset.cc));
    });
  }

  connectedCallback(): void {
    this.#sync();
  }

  disconnectedCallback(): void {
    document.removeEventListener('mousedown', this.#onDocMouseDown);
  }

  attributeChangedCallback(attr: string): void {
    if (attr === 'value') {
      this.value = Number(this.getAttribute('value') ?? '0');
    } else {
      if (this.disabled) this.#setOpen(false);
      this.#sync();
    }
  }

  get value(): number {
    return this.#value;
  }
  set value(v: number) {
    const next = Number(v);
    if (next === this.#value) return;
    this.#value = next;
    this.#sync();
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #canonicalLabel(): string {
    return pitchToLabel(ccToDisplayPitch(this.#value));
  }

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.#value, bubbles: true }),
    );
  }

  #buildOptions(): void {
    const frag = document.createDocumentFragment();
    for (let cc = 0; cc < ALL_LABELS.length; cc++) {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'pitch-picker__option';
      opt.setAttribute('role', 'option');
      opt.tabIndex = -1;
      opt.dataset.cc = String(cc);
      opt.textContent = ALL_LABELS[cc];
      frag.append(opt);
    }
    this.#popover.append(frag);
  }

  #step(delta: number): void {
    const next = Math.min(MAX, Math.max(MIN, this.#value + delta));
    if (next !== this.#value) {
      this.value = next;
      this.#emit();
    }
  }

  #pick(cc: number): void {
    this.#setOpen(false);
    this.value = cc;
    this.#emit();
  }

  #commit(): void {
    const draft = this.#input.value;
    if (draft === this.#canonicalLabel()) {
      this.#setInvalid(false);
      return;
    }
    const pitch = labelToPitch(draft);
    const cc = pitch === null ? null : displayPitchToCc(pitch);
    if (cc === null) {
      this.#setInvalid(true);
      return;
    }
    this.#setInvalid(false);
    this.value = cc;
    this.#emit();
  }

  #onInputKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.#step(1);
      if (!this.#open) this.#setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.#step(-1);
      if (!this.#open) this.#setOpen(true);
    } else if (e.key === 'Enter') {
      this.#input.blur();
    } else if (e.key === 'Escape') {
      if (this.#open) {
        e.preventDefault();
        this.#setOpen(false);
      } else {
        this.#input.value = this.#canonicalLabel();
        this.#setInvalid(false);
        this.#input.blur();
      }
    }
  }

  #setOpen(open: boolean): void {
    if (open === this.#open) return;
    this.#open = open;
    this.#popover.hidden = !open;
    this.#input.setAttribute('aria-expanded', String(open));
    if (open) {
      this.#popover.children[this.#value]?.scrollIntoView({ block: 'nearest' });
      document.addEventListener('mousedown', this.#onDocMouseDown);
    } else {
      document.removeEventListener('mousedown', this.#onDocMouseDown);
    }
  }

  #setInvalid(invalid: boolean): void {
    this.#input.classList.toggle('pitch-picker__input--invalid', invalid);
  }

  #updateSelection(): void {
    const opts = this.#popover.children;
    for (let cc = 0; cc < opts.length; cc++) {
      const selected = cc === this.#value;
      opts[cc].classList.toggle('is-selected', selected);
      opts[cc].setAttribute('aria-selected', String(selected));
    }
  }

  // Push value + disabled onto the DOM. Called only when value or disabled
  // changes — never while typing — so the draft is preserved for free.
  #sync(): void {
    const disabled = this.disabled;
    const value = this.#value;
    this.#input.value = disabled ? '' : this.#canonicalLabel();
    this.#input.disabled = disabled;
    this.#minusBtn.disabled = disabled || value <= MIN;
    this.#plusBtn.disabled = disabled || value >= MAX;
    this.#openBtn.disabled = disabled;
    this.#setInvalid(false);
    this.#updateSelection();
    if (this.#open) {
      this.#popover.children[value]?.scrollIntoView({ block: 'nearest' });
    }
  }
}

customElements.define('volca-pitch-picker', VolcaPitchPicker);

declare global {
  interface HTMLElementTagNameMap {
    'volca-pitch-picker': VolcaPitchPicker;
  }
}
