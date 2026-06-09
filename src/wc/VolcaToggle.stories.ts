import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-toggle';

interface ToggleArgs {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

const meta = {
  title: 'Controls/Toggle',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Link Layers',
    checked: false,
    disabled: false,
    onChange: fn(),
  },
  render: function Render(args) {
    const [{ checked }, updateArgs] = useArgs<ToggleArgs>();
    return html`<volca-toggle
      .label=${args.label}
      .checked=${checked}
      .disabled=${args.disabled}
      @change=${(e: CustomEvent<boolean>) => {
        updateArgs({ checked: e.detail });
        args.onChange(e.detail);
      }}
    ></volca-toggle>`;
  },
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<ToggleArgs>;

export const Off: Story = {
  args: { label: 'Pitch Quantization', checked: false },
};

export const On: Story = {
  args: { label: 'Pitch Quantization', checked: true },
};

export const Disabled: Story = {
  args: { label: 'Pitch Quantization', disabled: true },
};
