import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-icon-radio-group';
import type { IconRadioOption } from './volca-icon-radio-group';

interface RadioArgs {
  label: string;
  name: string;
  value: string;
  options: IconRadioOption[];
  disabled: boolean;
  onChange: (value: string) => void;
}

const meta = {
  title: 'Controls/IconRadioGroup',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { disabled: false, onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<RadioArgs>();
    return html`<div style="width: 360px">
      <volca-icon-radio-group
        .label=${args.label}
        .name=${args.name}
        .disabled=${args.disabled}
        .value=${value}
        .options=${args.options}
        @change=${(e: CustomEvent<string>) => {
          updateArgs({ value: e.detail });
          args.onChange(e.detail);
        }}
      ></volca-icon-radio-group>
    </div>`;
  },
} satisfies Meta<RadioArgs>;

export default meta;
type Story = StoryObj<RadioArgs>;

export const SoundSourceGroup: Story = {
  args: {
    label: 'Sound Source',
    name: 'sound-source',
    value: 'sine',
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'saw', label: 'Saw' },
      { value: 'noiseHP', label: 'HP' },
      { value: 'noiseLP', label: 'LP' },
      { value: 'noiseBP', label: 'BP' },
    ],
  },
};

export const ModTypeGroup: Story = {
  args: {
    label: 'Mod Type',
    name: 'mod-type',
    value: 'envelope',
    options: [
      { value: 'envelope', label: 'Env' },
      { value: 'lfo', label: 'LFO' },
      { value: 'random', label: 'Rnd' },
    ],
  },
};

export const AmpEGGroup: Story = {
  args: {
    label: 'Amp EG',
    name: 'amp-eg',
    value: 'ad',
    options: [
      { value: 'ad', label: 'AD' },
      { value: 'exp', label: 'Exp' },
      { value: 'multi', label: 'Multi' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    label: 'Sound Source',
    name: 'sound-source-disabled',
    value: 'sine',
    disabled: true,
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'saw', label: 'Saw' },
      { value: 'noiseHP', label: 'HP' },
    ],
  },
};
