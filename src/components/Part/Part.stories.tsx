import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Part } from './Part';
import { DEFAULT_PART, type PartState } from '../../types/part';
import { DEFAULT_LAYER } from '../../types/layer';

const meta = {
  title: 'Patch/Part',
  component: Part,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: PartState }>();
    return (
      <Part
        {...args}
        value={value}
        onChange={(change) => {
          if (change.kind === 'part') {
            updateArgs({ value: { ...value, [change.param]: change.value } });
          } else {
            const slotKey = change.slot === 1 ? 'layer1' : 'layer2';
            updateArgs({
              value: {
                ...value,
                [slotKey]: { ...value[slotKey], [change.param]: change.value },
              },
            });
          }
          args.onChange(change);
        }}
      />
    );
  },
} satisfies Meta<typeof Part>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Part 1',
    name: 'p1',
    partNumber: 1,
    value: DEFAULT_PART,
  },
};

export const Aggressive: Story = {
  args: {
    label: 'Part 2',
    name: 'p2',
    partNumber: 2,
    value: {
      ...DEFAULT_PART,
      drive: 110,
      bitReduction: 80,
      fold: 96,
      dryGain: 24,
      layer1: { ...DEFAULT_LAYER, soundSource: 'noiseHP', level: 110 },
      layer2: {
        ...DEFAULT_LAYER,
        soundSource: 'noiseBP',
        modType: 'random',
        level: 100,
        modAmount: 90,
      },
    },
  },
};

export const PitchQuantOn: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-pq',
    partNumber: 1,
    value: { ...DEFAULT_PART, pitchQuant: true },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-disabled',
    partNumber: 1,
    value: DEFAULT_PART,
    disabled: true,
  },
};
