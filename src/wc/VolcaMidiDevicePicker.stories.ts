import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useMemo } from 'storybook/preview-api';

import './volca-midi-device-picker';
import type {
  MidiOutputInfo,
  MidiSource,
  MidiSupport,
} from '../lib/midiController';

const VOLCA: MidiOutputInfo = { id: 'out-volca', name: 'KORG volca drum', connected: true };
const IAC: MidiOutputInfo = { id: 'out-iac', name: 'IAC Driver Bus 1', connected: true };
const VOLCA_OFF: MidiOutputInfo = { ...VOLCA, connected: false };

interface PickerArgs {
  support: MidiSupport;
  outputs: MidiOutputInfo[];
  selectedId: string | null;
  live: boolean;
}

// A stand-in for MidiController with the same MidiSource surface. Drop-in for
// stories where real Web MIDI is unavailable; the real store is covered by
// midiController.test.ts. Interactions mutate it and emit `change`, so the
// picker stays live.
class FakeMidiSource extends EventTarget implements MidiSource {
  support: MidiSupport;
  #outputs: MidiOutputInfo[];
  #selectedId: string | null;
  #live: boolean;

  constructor(init: PickerArgs) {
    super();
    this.support = init.support;
    this.#outputs = init.outputs;
    this.#selectedId = init.selectedId;
    this.#live = init.live;
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
    return null; // the picker doesn't read this; the app's send logic does
  }

  request(): Promise<void> {
    this.support = 'granted';
    if (this.#outputs.length === 0) this.#outputs = [VOLCA];
    const connected = this.#outputs.filter((o) => o.connected);
    if (this.#selectedId == null && connected.length === 1) {
      this.#selectedId = connected[0].id;
    }
    this.#emit();
    return Promise.resolve();
  }
  select(id: string | null): void {
    this.#selectedId = id;
    this.#emit();
  }
  setLive(value: boolean): void {
    this.#live = value;
    this.#emit();
  }
  #emit(): void {
    this.dispatchEvent(new Event('change'));
  }
}

const meta = {
  title: 'MIDI/MidiDevicePicker',
  parameters: { layout: 'padded' },
  args: { support: 'idle', outputs: [], selectedId: null, live: false },
  render: function Render(args) {
    // One fake source per story mount, seeded from the story args.
    const source = useMemo(() => new FakeMidiSource(args), []);
    return html`<div style="width: 32rem">
      <volca-midi-device-picker .controller=${source}></volca-midi-device-picker>
    </div>`;
  },
} satisfies Meta<PickerArgs>;

export default meta;
type Story = StoryObj<PickerArgs>;

export const Idle: Story = {
  args: { support: 'idle' },
};

export const Unsupported: Story = {
  args: { support: 'unsupported' },
};

export const PermissionDenied: Story = {
  args: { support: 'denied' },
};

export const NoDevices: Story = {
  args: { support: 'granted' },
};

export const OneDeviceSelected: Story = {
  args: { support: 'granted', outputs: [VOLCA], selectedId: VOLCA.id },
};

export const MultipleDevicesNoneSelected: Story = {
  args: { support: 'granted', outputs: [VOLCA, IAC], selectedId: null },
};

export const MultipleDevicesSelected: Story = {
  args: { support: 'granted', outputs: [VOLCA, IAC], selectedId: IAC.id, live: true },
};

export const SelectedDisconnected: Story = {
  args: { support: 'granted', outputs: [VOLCA_OFF], selectedId: VOLCA.id },
};

export const LiveOn: Story = {
  args: { support: 'granted', outputs: [VOLCA], selectedId: VOLCA.id, live: true },
};
