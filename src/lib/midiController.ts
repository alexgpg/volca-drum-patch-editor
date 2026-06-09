/**
 * MidiController — the Web MIDI state store.
 *
 * Port of the React `useMidi` hook (src/lib/useMidi.ts) to a framework-free
 * observable (see MIGRATION.md, "useMidi → a controller/store"). It is an
 * EventTarget: any state change emits a `change` event, and consumers (the
 * device-picker element, the app root) subscribe with the standard
 * addEventListener API and re-read the getters. That is the whole React→WC
 * delta — notify instead of re-render.
 *
 * The access factory is injected (defaulting to navigator.requestMIDIAccess)
 * so the store is unit-testable and story-able without real hardware — Web
 * MIDI exists in neither Node nor Storybook. Production callers use
 * `new MidiController()`; tests/stories pass a fake.
 *
 * `useMidi.ts` stays in place for the React app; this store is additive.
 */

export type MidiSupport = 'unsupported' | 'idle' | 'denied' | 'granted';

export interface MidiOutputInfo {
  id: string;
  name: string;
  connected: boolean;
}

/**
 * The read + action surface the UI depends on. `MidiController` implements it;
 * stories and tests substitute a fake. Elements take it as an injected
 * property — the WC equivalent of React's `App` passing `midi.*` down as props.
 */
export interface MidiSource extends EventTarget {
  readonly support: MidiSupport;
  readonly outputs: readonly MidiOutputInfo[];
  readonly selectedId: string | null;
  readonly live: boolean;
  readonly output: MIDIOutput | null;
  request(): Promise<void>;
  select(id: string | null): void;
  setLive(value: boolean): void;
}

export type RequestMidiAccess = () => Promise<MIDIAccess>;

function defaultRequest(): RequestMidiAccess | null {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
    ? () => navigator.requestMIDIAccess()
    : null;
}

function listOutputs(access: MIDIAccess): MidiOutputInfo[] {
  const list: MidiOutputInfo[] = [];
  access.outputs.forEach((o) => {
    list.push({
      id: o.id,
      name: o.name ?? o.id,
      connected: o.state === 'connected',
    });
  });
  return list;
}

export class MidiController extends EventTarget implements MidiSource {
  #requestAccess: RequestMidiAccess | null;
  #support: MidiSupport;
  #access: MIDIAccess | null = null;
  #outputs: MidiOutputInfo[] = [];
  #selectedId: string | null = null;
  #live = false;

  constructor(requestAccess: RequestMidiAccess | null = defaultRequest()) {
    super();
    this.#requestAccess = requestAccess;
    this.#support = requestAccess ? 'idle' : 'unsupported';
  }

  get support(): MidiSupport {
    return this.#support;
  }
  get outputs(): readonly MidiOutputInfo[] {
    return this.#outputs;
  }
  get selectedId(): string | null {
    return this.#selectedId;
  }
  get live(): boolean {
    return this.#live;
  }
  get output(): MIDIOutput | null {
    return this.#access && this.#selectedId
      ? this.#access.outputs.get(this.#selectedId) ?? null
      : null;
  }

  async request(): Promise<void> {
    if (!this.#requestAccess) return; // unsupported — nothing to request
    try {
      const access = await this.#requestAccess();
      this.#access = access;
      this.#support = 'granted';
      access.addEventListener('statechange', this.#refresh);
      this.#refresh();
    } catch {
      this.#support = 'denied';
      this.#emit();
    }
  }

  select(id: string | null): void {
    this.#selectedId = id;
    this.#emit();
  }

  setLive(value: boolean): void {
    this.#live = value;
    this.#emit();
  }

  /** Detach the device listener; call when the owner is torn down. */
  dispose(): void {
    this.#access?.removeEventListener('statechange', this.#refresh);
  }

  // Re-read the output list. Auto-selects the sole connected output, but only
  // while nothing is chosen yet — it never overrides an explicit selection.
  // (In React this needed a functional setState to dodge a stale closure; the
  // store just reads its own current field.)
  #refresh = (): void => {
    if (!this.#access) return;
    this.#outputs = listOutputs(this.#access);
    if (this.#selectedId == null) {
      const connected = this.#outputs.filter((o) => o.connected);
      this.#selectedId = connected.length === 1 ? connected[0].id : null;
    }
    this.#emit();
  };

  #emit(): void {
    this.dispatchEvent(new Event('change'));
  }
}
