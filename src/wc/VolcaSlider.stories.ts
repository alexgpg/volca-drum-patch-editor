import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-slider';

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
  title: 'Controls/Slider',
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
    const [{ value }, updateArgs] = useArgs<SliderArgs>();
    return html`<div style="width: 360px">
      <volca-slider
        .label=${args.label}
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        .disabled=${args.disabled}
        .value=${value}
        @change=${(e: CustomEvent<number>) => {
          updateArgs({ value: e.detail });
          args.onChange(e.detail);
        }}
      ></volca-slider>
    </div>`;
  },
} satisfies Meta<SliderArgs>;

export default meta;
type Story = StoryObj<SliderArgs>;

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
