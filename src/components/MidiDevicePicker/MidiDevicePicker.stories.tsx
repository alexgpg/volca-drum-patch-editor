import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import type { MidiOutputInfo } from '../../lib/useMidi';
import { MidiDevicePicker } from './MidiDevicePicker';
import type { MidiDevicePickerProps } from './MidiDevicePicker';

const VOLCA: MidiOutputInfo = {
  id: 'out-volca',
  name: 'KORG volca drum',
  connected: true,
};

const IAC: MidiOutputInfo = {
  id: 'out-iac',
  name: 'IAC Driver Bus 1',
  connected: true,
};

const VOLCA_DISCONNECTED: MidiOutputInfo = {
  ...VOLCA,
  connected: false,
};

type Args = MidiDevicePickerProps;

const meta = {
  title: 'MIDI/MidiDevicePicker',
  component: MidiDevicePicker,
  parameters: { layout: 'padded' },
  args: {
    onConnect: fn(),
    onSelect: fn(),
    onLiveChange: fn(),
  },
  render: function Render(args) {
    const [{ selectedId, live }, updateArgs] = useArgs<Args>();
    return (
      <div style={{ width: '32rem' }}>
        <MidiDevicePicker
          {...args}
          selectedId={selectedId}
          live={live}
          onSelect={(id) => {
            updateArgs({ selectedId: id });
            args.onSelect(id);
          }}
          onLiveChange={(v) => {
            updateArgs({ live: v });
            args.onLiveChange(v);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof MidiDevicePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    support: 'idle',
    outputs: [],
    selectedId: null,
    live: false,
  },
};

export const Unsupported: Story = {
  args: {
    support: 'unsupported',
    outputs: [],
    selectedId: null,
    live: false,
  },
};

export const PermissionDenied: Story = {
  args: {
    support: 'denied',
    outputs: [],
    selectedId: null,
    live: false,
  },
};

export const NoDevices: Story = {
  args: {
    support: 'granted',
    outputs: [],
    selectedId: null,
    live: false,
  },
};

export const OneDeviceSelected: Story = {
  args: {
    support: 'granted',
    outputs: [VOLCA],
    selectedId: VOLCA.id,
    live: false,
  },
};

export const MultipleDevicesNoneSelected: Story = {
  args: {
    support: 'granted',
    outputs: [VOLCA, IAC],
    selectedId: null,
    live: false,
  },
};

export const MultipleDevicesSelected: Story = {
  args: {
    support: 'granted',
    outputs: [VOLCA, IAC],
    selectedId: IAC.id,
    live: true,
  },
};

export const SelectedDisconnected: Story = {
  args: {
    support: 'granted',
    outputs: [VOLCA_DISCONNECTED],
    selectedId: VOLCA.id,
    live: false,
  },
};

export const LiveOn: Story = {
  args: {
    support: 'granted',
    outputs: [VOLCA],
    selectedId: VOLCA.id,
    live: true,
  },
};
