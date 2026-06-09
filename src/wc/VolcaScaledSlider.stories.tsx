import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import type { ScaledParam } from '../lib/deviceScale';
import './volca-scaled-slider';
import type { VolcaScaledSlider } from './volca-scaled-slider';

// Teach TSX about <volca-scaled-slider> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-scaled-slider': DetailedHTMLProps<
        HTMLAttributes<VolcaScaledSlider>,
        VolcaScaledSlider
      >;
    }
  }
}

const PARAMS: ScaledParam[] = [
  'level',
  'egAttack',
  'egRelease',
  'modAmount',
  'modRate',
  'pan',
  'send',
  'drive',
  'bitReduction',
  'fold',
  'dryGain',
];

interface ScaledSliderArgs {
  param: ScaledParam;
  cc: number;
  disabled: boolean;
  onChange: (cc: number) => void;
}

const meta = {
  title: 'WC/ScaledSlider',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    param: 'level',
    cc: 64,
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    param: { control: 'select', options: PARAMS },
    cc: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  },
  render: function Render(args) {
    const [{ param, cc, disabled }, updateArgs] = useArgs<ScaledSliderArgs>();
    const ref = useRef<VolcaScaledSlider>(null);

    // Property in: set param before cc, since param fixes the LCD range.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.param = param;
      el.disabled = disabled;
      el.cc = cc;
    }, [param, cc, disabled]);

    // Event out: detail is a MIDI CC (0..127). Mirror it back to the control.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const v = (event as CustomEvent<number>).detail;
        updateArgs({ cc: v });
        args.onChange(v);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return (
      <div style={{ width: 360 }}>
        <volca-scaled-slider ref={ref} />
      </div>
    );
  },
} satisfies Meta<ScaledSliderArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Level is a "doubler" param: CC 100 → LCD 200 (range 0..255, step 2).
export const Level: Story = {
  args: { param: 'level', cc: 100 },
};

// Mod Amount is a bipolar "hundred" param: range -100..100, step 1.
export const ModAmount: Story = {
  args: { param: 'modAmount', cc: 96 },
};

export const Pan: Story = {
  args: { param: 'pan', cc: 64 },
};

export const Disabled: Story = {
  args: { param: 'level', cc: 64, disabled: true },
};
