/**
 * <volca-kit> — the kit-level header: name, whole-kit copy/paste and the
 * starter-kit library picker.
 *
 * Web Component port of the React <Kit> (src/components/Kit/Kit.tsx).
 *
 *   - property in   el.value = KitState; el.kits = PartialKit[] (the library)
 *   - event out     'change' CustomEvent, detail: PatchChange —
 *                   {kind:'kit', param:'comment', …} for name edits and
 *                   {kind:'kit-replace', value: PartialKit} for a pasted code
 *                   or a library pick. (A partial kit overlays positionally;
 *                   the reducer leaves the remaining parts untouched.)
 */

import './volca-patch-code';
import type { VolcaPatchCode } from './volca-patch-code';
import { matchKitIndex } from '../lib/libraryMatch';
import { decodeKit, encodeKit } from '../lib/patchCodec';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchChange,
} from '../types/patch';

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host { display: block; }
    .kit { margin-inline: 1rem; }
    .kit__body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .kit__comment {
      width: 100%;
      font-size: 1rem;
      font-weight: 600;
    }
  </style>
  <details class="kit card" open>
    <summary class="kit__title card-title"></summary>
    <div class="kit__body">
      <label class="kit__preset preset-row" hidden>
        <span class="group-label">Kit</span>
        <select class="kit__preset-select control"></select>
      </label>
      <input type="text" class="kit__comment control" placeholder="kit name" aria-label="Kit name" />
      <volca-patch-code placeholder="# kit name&#10;vP1:..."></volca-patch-code>
    </div>
  </details>
`;

export class VolcaKit extends HTMLElement {
  static observedAttributes = ['disabled'];

  #title: HTMLElement;
  #presetRow: HTMLElement;
  #presetSelect: HTMLSelectElement;
  #comment: HTMLInputElement;
  #patchCode: VolcaPatchCode;
  #value: KitState = DEFAULT_KIT;
  #kits: PartialKit[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    customElements.upgrade(root);
    this.#title = root.querySelector<HTMLElement>('.kit__title')!;
    this.#presetRow = root.querySelector<HTMLElement>('.kit__preset')!;
    this.#presetSelect = root.querySelector<HTMLSelectElement>('.kit__preset-select')!;
    this.#comment = root.querySelector<HTMLInputElement>('.kit__comment')!;
    this.#patchCode = root.querySelector<VolcaPatchCode>('volca-patch-code')!;

    this.#presetSelect.addEventListener('change', () => {
      const kit = this.#kits[Number(this.#presetSelect.value)];
      this.#presetSelect.value = '';
      if (kit) this.#emit({ kind: 'kit-replace', value: kit });
    });

    this.#comment.addEventListener('input', () => {
      this.#emit({ kind: 'kit', param: 'comment', value: this.#comment.value });
    });

    this.#patchCode.addEventListener('apply', (e) => {
      const parsed = decodeKit((e as CustomEvent<string>).detail);
      if (!parsed) {
        e.preventDefault();
        return;
      }
      this.#emit({ kind: 'kit-replace', value: parsed });
    });
  }

  connectedCallback(): void {
    this.#sync();
  }

  attributeChangedCallback(): void {
    this.#sync();
  }

  get value(): KitState {
    return this.#value;
  }
  set value(v: KitState) {
    this.#value = v;
    this.#sync();
  }

  get kits(): PartialKit[] {
    return this.#kits;
  }
  set kits(v: PartialKit[]) {
    this.#kits = v ?? [];
    this.#renderKits();
    this.#syncKitSelection();
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #emit(change: PatchChange): void {
    this.dispatchEvent(
      new CustomEvent<PatchChange>('change', { detail: change, bubbles: true }),
    );
  }

  #renderKits(): void {
    this.#presetRow.hidden = this.#kits.length === 0;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.textContent = 'Choose a kit…';
    this.#presetSelect.replaceChildren(
      placeholder,
      ...this.#kits.map((kit, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = kit.comment.trim() === '' ? '(unnamed)' : kit.comment;
        return opt;
      }),
    );
    this.#presetSelect.value = '';
  }

  // Derived, not remembered: show the library kit the state currently
  // matches (comment + every part the partial kit specifies).
  #syncKitSelection(): void {
    const i = matchKitIndex(this.#kits, this.#value);
    this.#presetSelect.value = i === -1 ? '' : String(i);
  }

  #sync(): void {
    const v = this.#value;
    const disabled = this.disabled;

    this.#title.textContent = v.comment ? `Kit — ${v.comment}` : 'Kit';

    if (this.#comment.value !== v.comment) this.#comment.value = v.comment;
    this.#comment.disabled = disabled;

    this.#patchCode.value = encodeKit(v);
    this.#patchCode.disabled = disabled;
    this.#presetSelect.disabled = disabled;
    this.#syncKitSelection();
  }
}

customElements.define('volca-kit', VolcaKit);

declare global {
  interface HTMLElementTagNameMap {
    'volca-kit': VolcaKit;
  }
}
