import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-pitch-picker';

interface PitchArgs {
  value: number;
  disabled: boolean;
  onChange: (cc: number) => void;
}

const meta = {
  title: 'Controls/PitchPicker',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { value: 64, disabled: false, onChange: fn() },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<PitchArgs>();
    return html`<div style="width: 240px">
      <volca-pitch-picker
        .disabled=${args.disabled}
        .value=${value}
        @change=${(e: CustomEvent<number>) => {
          updateArgs({ value: e.detail });
          args.onChange(e.detail);
        }}
      ></volca-pitch-picker>
    </div>`;
  },
} satisfies Meta<PitchArgs>;

export default meta;
type Story = StoryObj<PitchArgs>;

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
