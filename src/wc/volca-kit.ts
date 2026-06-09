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
import { decodeKit, encodeKit } from '../lib/patchCodec';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchChange,
} from '../types/patch';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .kit {
      margin-inline: 1rem;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 10px;
      background: #f3f3f3;
      font-family: ui-sans-serif, system-ui, sans-serif;
      box-sizing: border-box;
    }
    .kit__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .kit__title:hover { color: #2b6cb0; }
    .kit__body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .kit__preset {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .kit__preset[hidden] { display: none; }
    .kit__preset-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kit__preset-select {
      flex: 1;
      padding: 0.375rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      font: inherit;
      font-size: 0.875rem;
      color: #333;
    }
    .kit__preset-select:focus {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
      border-color: #2b6cb0;
    }
    .kit__preset-select:disabled {
      background: #f0f0f0;
      color: #888;
    }
    .kit__comment {
      width: 100%;
      box-sizing: border-box;
      padding: 0.375rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      font: inherit;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }
    .kit__comment:focus {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
      border-color: #2b6cb0;
    }
    .kit__comment:disabled {
      background: #f0f0f0;
      color: #888;
    }
  </style>
  <details class="kit" open>
    <summary class="kit__title"></summary>
    <div class="kit__body">
      <label class="kit__preset" hidden>
        <span class="kit__preset-label">Kit</span>
        <select class="kit__preset-select"></select>
      </label>
      <input type="text" class="kit__comment" placeholder="kit name" aria-label="Kit name" />
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

  #sync(): void {
    const v = this.#value;
    const disabled = this.disabled;

    this.#title.textContent = v.comment ? `Kit — ${v.comment}` : 'Kit';

    if (this.#comment.value !== v.comment) this.#comment.value = v.comment;
    this.#comment.disabled = disabled;

    this.#patchCode.value = encodeKit(v);
    this.#patchCode.disabled = disabled;
    this.#presetSelect.disabled = disabled;
  }
}

customElements.define('volca-kit', VolcaKit);

declare global {
  interface HTMLElementTagNameMap {
    'volca-kit': VolcaKit;
  }
}
