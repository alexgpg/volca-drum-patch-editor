/**
 * <volca-patch> — all six drum parts of the editor.
 *
 * Web Component port of the React <Patch> (src/components/Patch/Patch.tsx).
 * This was the designated "Lit decision point" (MIGRATION.md) — and the
 * verdict is that no templating library is needed: the part list is a fixed
 * six-tuple (PatchState), never resized, so it's a static template like every
 * other composite, not a dynamic list.
 *
 *   - property in   el.value = PatchState (readonly 6-tuple)
 *                   el.presets = PartPreset[] (forwarded to every part)
 *   - event out     'change' CustomEvent, detail: PartScopedChange —
 *                   each part's PartChange wrapped with its 1-based partIndex.
 */

import './volca-part';
import type { VolcaPart } from './volca-part';
import type { PartPreset } from '../lib/partLibrary';
import type { PartChange } from '../types/part';
import {
  DEFAULT_PATCH,
  type PartIndex,
  type PartScopedChange,
  type PatchState,
} from '../types/patch';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .patch {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      /* themable from outside (the app trims the top under its sticky header) */
      padding: var(--volca-patch-padding, 1rem);
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
  </style>
  <div class="patch">
    <volca-part></volca-part>
    <volca-part></volca-part>
    <volca-part></volca-part>
    <volca-part></volca-part>
    <volca-part></volca-part>
    <volca-part></volca-part>
  </div>
`;

export class VolcaPatch extends HTMLElement {
  static observedAttributes = ['disabled'];

  #parts: VolcaPart[];
  #value: PatchState = DEFAULT_PATCH;
  #presets: PartPreset[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    customElements.upgrade(root);
    this.#parts = [...root.querySelectorAll<VolcaPart>('volca-part')];

    this.#parts.forEach((part, i) => {
      const partIndex = (i + 1) as PartIndex;
      part.addEventListener('change', (e) => {
        const change = (e as CustomEvent<PartChange>).detail;
        this.dispatchEvent(
          new CustomEvent<PartScopedChange>('change', {
            detail: { partIndex, change },
            bubbles: true,
          }),
        );
      });
    });
  }

  connectedCallback(): void {
    this.#sync();
  }

  attributeChangedCallback(): void {
    this.#sync();
  }

  get value(): PatchState {
    return this.#value;
  }
  set value(v: PatchState) {
    this.#value = v;
    this.#sync();
  }

  get presets(): PartPreset[] {
    return this.#presets;
  }
  set presets(v: PartPreset[]) {
    this.#presets = v ?? [];
    for (const part of this.#parts) part.presets = this.#presets;
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #sync(): void {
    const disabled = this.disabled;
    this.#parts.forEach((part, i) => {
      part.label = `Part ${i + 1}`;
      part.name = `p${i + 1}`;
      part.disabled = disabled;
      part.value = this.#value[i];
    });
  }
}

customElements.define('volca-patch', VolcaPatch);

declare global {
  interface HTMLElementTagNameMap {
    'volca-patch': VolcaPatch;
  }
}
