import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-slider';
import type { VolcaSlider } from './volca-slider';

// Teach TSX about <volca-slider> (see VolcaToggle.stories for the rationale).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-slider': DetailedHTMLProps<HTMLAttributes<VolcaSlider>, VolcaSlider>;
    }
  }
}

interface SliderArgs {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

const meta = {
  title: 'WC/Slider',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Level',
    value: 64,
    min: 0,
    max: 127,
    step: 1,
    disabled: false,
    onChange: fn(),
  },
  render: function Render(args) {
    const [{ label, value, min, max, step, disabled }, updateArgs] =
      useArgs<SliderArgs>();
    const ref = useRef<VolcaSlider>(null);

    // Property in: set bounds before value so clamping uses the right range.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.label = label;
      el.min = min;
      el.max = max;
      el.step = step;
      el.disabled = disabled;
      el.value = value;
    }, [label, value, min, max, step, disabled]);

    // Event out: mirror `change` into the control + the Actions panel.
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
      <div style={{ width: 360 }}>
        <volca-slider ref={ref} />
      </div>
    );
  },
} satisfies Meta<SliderArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level: Story = {
  args: { label: 'Level', value: 100 },
};

export const Pitch: Story = {
  args: { label: 'Pitch', value: 64 },
};

export const ModAmount: Story = {
  args: { label: 'Mod Amount', value: 32 },
};

export const Disabled: Story = {
  args: { label: 'Level', value: 50, disabled: true },
};
