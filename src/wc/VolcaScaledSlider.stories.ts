import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import type { ScaledParam } from '../lib/deviceScale';
import './volca-scaled-slider';

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
  title: 'Controls/ScaledSlider',
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
    const [{ cc }, updateArgs] = useArgs<ScaledSliderArgs>();
    return html`<div style="width: 360px">
      <volca-scaled-slider
        .param=${args.param}
        .disabled=${args.disabled}
        .cc=${cc}
        @change=${(e: CustomEvent<number>) => {
          updateArgs({ cc: e.detail });
          args.onChange(e.detail);
        }}
      ></volca-scaled-slider>
    </div>`;
  },
} satisfies Meta<ScaledSliderArgs>;

export default meta;
type Story = StoryObj<ScaledSliderArgs>;

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
