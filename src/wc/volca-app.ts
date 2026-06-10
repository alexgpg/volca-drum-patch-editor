/**
 * <volca-app> — the application root.
 *
 * Web Component port of src/App.tsx, completing the tree: it owns the one
 * piece of app state (KitState), the MidiController, and the change pipeline.
 *
 * State flows exactly as in React: children are property-fed from #kit, every
 * edit arrives here as a single PatchChange, the reducer (applyPatchChange)
 * builds the next state — treated as immutable throughout — and when Live is
 * armed the same change is mirrored to the device as CCs before the UI syncs.
 *
 * useState → a private field + #sync(); useEffect([]) → connectedCallback;
 * the useMidi hook → the MidiController instance handed to the picker.
 */

import './volca-kit';
import './volca-midi-device-picker';
import './volca-patch';
import type { VolcaKit } from './volca-kit';
import type { VolcaMidiDevicePicker } from './volca-midi-device-picker';
import type { VolcaPatch } from './volca-patch';
import { applyPatchChange } from '../lib/applyPatchChange';
import { loadKitLibrary } from '../lib/kitLibrary';
import { MidiController } from '../lib/midiController';
import { sendPartChange } from '../lib/midiSend';
import { loadPartLibrary } from '../lib/partLibrary';
import {
  DEFAULT_KIT,
  type KitState,
  type PartIndex,
  type PatchChange,
} from '../types/patch';

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host { display: block; }
    .app {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .app__midi {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 0.75rem 1rem 0;
      background: linear-gradient(to bottom, var(--_surface) 70%, transparent);
    }
    volca-patch {
      /* React's ".app > .patch { padding-top: 0 }" — through the boundary */
      --volca-patch-padding: 0 1rem 1rem;
    }
  </style>
  <div class="app">
    <header class="app__midi">
      <volca-midi-device-picker></volca-midi-device-picker>
    </header>
    <volca-kit></volca-kit>
    <volca-patch></volca-patch>
  </div>
`;

export class VolcaApp extends HTMLElement {
  #kit: KitState = DEFAULT_KIT;
  #midi = new MidiController();
  #picker: VolcaMidiDevicePicker;
  #kitEl: VolcaKit;
  #patchEl: VolcaPatch;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    customElements.upgrade(root);
    this.#picker = root.querySelector<VolcaMidiDevicePicker>('volca-midi-device-picker')!;
    this.#kitEl = root.querySelector<VolcaKit>('volca-kit')!;
    this.#patchEl = root.querySelector<VolcaPatch>('volca-patch')!;

    // Both children speak PatchChange (PartScopedChange is one of its arms).
    this.#kitEl.addEventListener('change', (e) => {
      this.#onChange((e as CustomEvent<PatchChange>).detail);
    });
    this.#patchEl.addEventListener('change', (e) => {
      this.#onChange((e as CustomEvent<PatchChange>).detail);
    });
  }

  connectedCallback(): void {
    this.#picker.controller = this.#midi;
    loadPartLibrary().then((presets) => {
      this.#patchEl.presets = presets;
    });
    loadKitLibrary().then((kits) => {
      this.#kitEl.kits = kits;
    });
    this.#sync();
  }

  disconnectedCallback(): void {
    this.#midi.dispose();
  }

  // Ported verbatim from App.tsx's onChange.
  #onChange(c: PatchChange): void {
    const nextKit = applyPatchChange(this.#kit, c);
    const output = this.#midi.output;
    if (this.#midi.live && output) {
      if ('kind' in c) {
        if (c.kind === 'kit-replace') {
          // Only send CCs for the parts the paste actually replaced;
          // a partial kit (N<6) leaves the device-side parts N+1..6 alone.
          for (let i = 0; i < c.value.parts.length; i++) {
            const partIndex = (i + 1) as PartIndex;
            const part = nextKit.parts[i];
            sendPartChange(
              output,
              partIndex,
              { kind: 'part-replace', value: part },
              part,
            );
          }
        }
        // kind === 'kit' (comment edit) — no MIDI.
      } else {
        const i = c.partIndex - 1;
        sendPartChange(output, c.partIndex, c.change, nextKit.parts[i]);
      }
    }
    this.#kit = nextKit;
    this.#sync();
  }

  #sync(): void {
    this.#kitEl.value = this.#kit;
    this.#patchEl.value = this.#kit.parts;
  }
}

customElements.define('volca-app', VolcaApp);

declare global {
  interface HTMLElementTagNameMap {
    'volca-app': VolcaApp;
  }
}
