/**
 * <volca-midi-device-picker> — the MIDI device chooser.
 *
 * Web Component port of the React <MidiDevicePicker>. The React version was a
 * stateless view over props + callbacks; this one is driven by an injected
 * store (the `controller` property, typed as `MidiSource`). It subscribes to
 * the store's `change` event, re-reads the getters on every change, and its
 * controls call `controller.request()/select()/setLive()` directly — it emits
 * no events of its own. The app's send logic reads the same store.
 *
 * Property injection (not a global import) is what lets stories/tests drive it
 * with a fake source — Web MIDI exists in neither Storybook nor Node.
 *
 * Re-renders rebuild the body (the five views differ structurally). That's
 * fine at this size; it's also the spot where Lit's templating would start to
 * earn its keep — see MIGRATION.md.
 */

import './volca-toggle';
import type { MidiSource } from '../lib/midiController';

import { SHARED_CSS } from './shared-styles';

const template = document.createElement('template');
template.innerHTML = `
  <style>${SHARED_CSS}</style>
  <style>
    :host { display: block; }
    .midi-picker {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--_border-soft);
      background: var(--_surface-1);
      font-family: var(--_font-ui);
      font-size: 0.875rem;
    }
    .midi-picker--message,
    .midi-picker__message,
    .midi-picker__prefix { color: var(--_muted); }
    .midi-picker__connect {
      padding: 0.4rem 0.9rem;
      border: 1px solid var(--_accent);
      border-radius: 4px;
      background: var(--_accent);
      color: var(--_on-accent);
      font: inherit;
      cursor: pointer;
    }
    .midi-picker__connect:hover { background: var(--_accent-hover); }
    .midi-picker__dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .midi-picker__dot--on {
      background: #38a169;
      box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.2);
    }
    .midi-picker__dot--off { background: #cbd5e0; }
    .midi-picker__select-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex: 1;
      min-width: 0;
    }
    .midi-picker__prefix { white-space: nowrap; }
    .midi-picker__select {
      flex: 1;
      min-width: 0;
      padding: 0.25rem 0.4rem;
    }
    /* Compact the Live toggle by theming it from outside — selectors can't
       reach into its shadow root, but these custom properties can. */
    .midi-picker__live {
      flex-shrink: 0;
      --volca-toggle-columns: auto auto auto;
      --volca-toggle-gap: 0.4rem;
    }
    .midi-picker__disconnect {
      flex-shrink: 0;
      padding: 0.3rem 0.65rem;
      background: var(--_surface);
      font-size: 0.8125rem;
    }
  </style>
  <div class="root"></div>
`;

export class VolcaMidiDevicePicker extends HTMLElement {
  #root: HTMLElement;
  #controller: MidiSource | null = null;
  #onChange = (): void => this.#render();

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#root = root.querySelector<HTMLElement>('.root')!;
  }

  get controller(): MidiSource | null {
    return this.#controller;
  }
  set controller(c: MidiSource | null) {
    if (c === this.#controller) return;
    this.#controller?.removeEventListener('change', this.#onChange);
    this.#controller = c;
    if (this.isConnected) c?.addEventListener('change', this.#onChange);
    this.#render();
  }

  connectedCallback(): void {
    this.#controller?.addEventListener('change', this.#onChange);
    this.#render();
  }

  disconnectedCallback(): void {
    this.#controller?.removeEventListener('change', this.#onChange);
  }

  #region(): HTMLElement {
    const region = document.createElement('div');
    region.className = 'midi-picker';
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'MIDI device');
    return region;
  }

  #dot(on: boolean): HTMLElement {
    const dot = document.createElement('span');
    dot.className = `midi-picker__dot midi-picker__dot--${on ? 'on' : 'off'}`;
    dot.setAttribute('aria-hidden', 'true');
    return dot;
  }

  #message(text: string): void {
    const region = this.#region();
    region.classList.add('midi-picker--message');
    region.textContent = text;
    this.#root.replaceChildren(region);
  }

  #render(): void {
    const c = this.#controller;
    if (!c) {
      this.#root.replaceChildren();
      return;
    }

    if (c.support === 'unsupported') {
      this.#message('Web MIDI is not supported in this browser.');
      return;
    }
    if (c.support === 'denied') {
      this.#message('MIDI access denied — enable it in your browser settings.');
      return;
    }
    if (c.support === 'idle') {
      const region = this.#region();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'midi-picker__connect';
      btn.textContent = 'Connect MIDI';
      btn.addEventListener('click', () => void c.request());
      region.append(btn);
      this.#root.replaceChildren(region);
      return;
    }

    // granted
    const region = this.#region();
    const outputs = c.outputs;
    if (outputs.length === 0) {
      region.append(this.#dot(false));
      const msg = document.createElement('span');
      msg.className = 'midi-picker__message';
      msg.textContent = 'No MIDI devices found — plug one in.';
      region.append(msg);
      this.#root.replaceChildren(region);
      return;
    }

    const selected = outputs.find((o) => o.id === c.selectedId) ?? null;
    const connected = selected?.connected ?? false;
    const liveDisabled = !connected;

    region.append(this.#dot(connected));

    const label = document.createElement('label');
    label.className = 'midi-picker__select-label';
    const prefix = document.createElement('span');
    prefix.className = 'midi-picker__prefix';
    prefix.textContent = connected ? 'Sending to:' : 'Device:';
    label.append(prefix);

    const select = document.createElement('select');
    select.className = 'midi-picker__select control';
    if (selected === null) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select device…';
      select.append(placeholder);
    }
    for (const o of outputs) {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.connected ? o.name : `${o.name} (disconnected)`;
      select.append(opt);
    }
    select.value = c.selectedId ?? '';
    select.addEventListener('change', () => {
      c.select(select.value === '' ? null : select.value);
    });
    label.append(select);
    region.append(label);

    const liveWrap = document.createElement('div');
    liveWrap.className = 'midi-picker__live';
    const toggle = document.createElement('volca-toggle');
    toggle.label = 'Live';
    toggle.checked = c.live && !liveDisabled;
    toggle.disabled = liveDisabled;
    toggle.addEventListener('change', (e) => {
      c.setLive((e as CustomEvent<boolean>).detail);
    });
    liveWrap.append(toggle);
    region.append(liveWrap);

    if (selected !== null) {
      const disconnect = document.createElement('button');
      disconnect.type = 'button';
      disconnect.className = 'midi-picker__disconnect btn';
      disconnect.textContent = 'Disconnect';
      disconnect.addEventListener('click', () => {
        c.setLive(false);
        c.select(null);
      });
      region.append(disconnect);
    }

    this.#root.replaceChildren(region);
  }
}

customElements.define('volca-midi-device-picker', VolcaMidiDevicePicker);

declare global {
  interface HTMLElementTagNameMap {
    'volca-midi-device-picker': VolcaMidiDevicePicker;
  }
}
