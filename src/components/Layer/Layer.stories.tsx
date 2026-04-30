import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Layer } from './Layer';
import { DEFAULT_LAYER, type LayerState } from '../../types/layer';

const meta = {
  title: 'Patch/Layer',
  component: Layer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn(), onReplace: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: LayerState }>();
    return (
      <Layer
        {...args}
        value={value}
        onChange={(param, v) => {
          updateArgs({ value: { ...value, [param]: v } });
          args.onChange(param, v);
        }}
        onReplace={(next) => {
          updateArgs({ value: next });
          args.onReplace?.(next);
        }}
      />
    );
  },
} satisfies Meta<typeof Layer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Layer 1',
    name: 'p1l1',
    value: DEFAULT_LAYER,
  },
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

export const Disabled: Story = {
  args: {
    label: 'Layer 1',
    name: 'p1l1-disabled',
    value: DEFAULT_LAYER,
    disabled: true,
  },
};
