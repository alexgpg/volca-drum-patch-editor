import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-layer';
import type { LayerChangeDetail } from './volca-layer';
import { DEFAULT_LAYER, type LayerState } from '../types/layer';

interface LayerArgs {
  label: string;
  name: string;
  value: LayerState;
  disabled: boolean;
  pitchQuant: boolean;
  onChange: (param: keyof LayerState, value: LayerState[keyof LayerState]) => void;
  onReplace: (next: LayerState) => void;
}

const meta = {
  title: 'Patch/Layer',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Layer',
    name: 'layer',
    value: DEFAULT_LAYER,
    disabled: false,
    pitchQuant: false,
    onChange: fn(),
    onReplace: fn(),
  },
  // 'change' carries {param, value}; 'replace' a whole decoded LayerState.
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<LayerArgs>();
    return html`<volca-layer
      .label=${args.label}
      .name=${args.name}
      .disabled=${args.disabled}
      .pitchQuant=${args.pitchQuant}
      .value=${value}
      @change=${(e: CustomEvent<LayerChangeDetail>) => {
        const { param, value: v } = e.detail;
        updateArgs({ value: { ...value, [param]: v } });
        args.onChange(param, v);
      }}
      @replace=${(e: CustomEvent<LayerState>) => {
        updateArgs({ value: e.detail });
        args.onReplace(e.detail);
      }}
    ></volca-layer>`;
  },
} satisfies Meta<LayerArgs>;

export default meta;
type Story = StoryObj<LayerArgs>;

export const Default: Story = {
  args: { label: 'Layer 1', name: 'p1l1' },
};

export const NoiseLayer: Story = {
  args: {
    label: 'Layer 2',
    name: 'p1l2',
    value: {
      ...DEFAULT_LAYER,
      soundSource: 'noiseHP',
      modType: 'random',
      ampEG: 'multi',
      level: 90,
      pitch: 80,
      modAmount: 64,
    },
  },
};

export const PitchQuantOn: Story = {
  args: { label: 'Layer 1', name: 'p1l1-qpi', pitchQuant: true },
};

export const Disabled: Story = {
  args: { label: 'Layer 1', name: 'p1l1-disabled', disabled: true },
};
