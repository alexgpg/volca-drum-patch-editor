import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';

import './volca-midi-device-picker';
import type { VolcaMidiDevicePicker } from './volca-midi-device-picker';
import type {
  MidiOutputInfo,
  MidiSource,
  MidiSupport,
} from '../lib/midiController';

// Teach TSX about <volca-midi-device-picker> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-midi-device-picker': DetailedHTMLProps<
        HTMLAttributes<VolcaMidiDevicePicker>,
        VolcaMidiDevicePicker
      >;
    }
  }
}

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
  title: 'WC/MidiDevicePicker',
  parameters: { layout: 'padded' },
  args: { support: 'idle', outputs: [], selectedId: null, live: false },
  render: function Render(args) {
    const ref = useRef<VolcaMidiDevicePicker>(null);
    const source = useRef<FakeMidiSource | null>(null);
    source.current ??= new FakeMidiSource(args); // seed once from the story args

    useEffect(() => {
      if (ref.current) ref.current.controller = source.current;
    }, []);

    return (
      <div style={{ width: '32rem' }}>
        <volca-midi-device-picker ref={ref} />
      </div>
    );
  },
} satisfies Meta<PickerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

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
