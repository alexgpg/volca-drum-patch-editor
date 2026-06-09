import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-pitch-picker';
import type { VolcaPitchPicker } from './volca-pitch-picker';

// Teach TSX about <volca-pitch-picker> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-pitch-picker': DetailedHTMLProps<
        HTMLAttributes<VolcaPitchPicker>,
        VolcaPitchPicker
      >;
    }
  }
}

interface PitchArgs {
  value: number;
  disabled: boolean;
  onChange: (cc: number) => void;
}

const meta = {
  title: 'WC/PitchPicker',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { value: 64, disabled: false, onChange: fn() },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  },
  render: function Render(args) {
    const [{ value, disabled }, updateArgs] = useArgs<PitchArgs>();
    const ref = useRef<VolcaPitchPicker>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.disabled = disabled;
      el.value = value;
    }, [value, disabled]);

    // Event out: detail is a MIDI CC (0..127).
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const v = (event as CustomEvent<number>).detail;
        updateArgs({ value: v });
        args.onChange(v);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return (
      <div style={{ width: 240 }}>
        <volca-pitch-picker ref={ref} />
      </div>
    );
  },
} satisfies Meta<PitchArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 64 }, // D#4
};

export const LowEnd: Story = {
  args: { value: 0 }, // C-1, minus button disabled
};

export const HighEnd: Story = {
  args: { value: 127 }, // F#9, plus button disabled
};

export const Disabled: Story = {
  args: { value: 64, disabled: true },
};
