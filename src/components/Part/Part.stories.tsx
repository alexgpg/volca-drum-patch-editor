import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Part } from './Part';
import { applyPartChange } from '../../lib/applyPartChange';
import type { PartPreset } from '../../lib/partLibrary';
import { DEFAULT_PART, type PartState } from '../../types/part';
import { DEFAULT_LAYER } from '../../types/layer';

const meta = {
  title: 'Patch/Part',
  component: Part,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: PartState }>();
    return (
      <Part
        {...args}
        value={value}
        onChange={(change) => {
          updateArgs({ value: applyPartChange(value, change) });
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
    value: DEFAULT_PART,
  },
};

export const Aggressive: Story = {
  args: {
    label: 'Part 2',
    name: 'p2',
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

export const Linked: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-linked',
    value: { ...DEFAULT_PART, linked: true },
  },
};

export const PitchQuantOn: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-pq',
    value: { ...DEFAULT_PART, pitchQuant: true },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-disabled',
    value: DEFAULT_PART,
    disabled: true,
  },
};

const mockPresets: PartPreset[] = [
  {
    name: 'Kick: A1-Book',
    part: {
      ...DEFAULT_PART,
      comment: 'Kick: A1-Book',
      drive: 24,
      fold: 78,
      pitchQuant: true,
      layer1: { ...DEFAULT_LAYER, soundSource: 'sine', level: 127, modAmount: 39 },
      layer2: { ...DEFAULT_LAYER, soundSource: 'sine', modType: 'envelope' },
    },
  },
  {
    name: 'Snare A1 Short Book',
    part: {
      ...DEFAULT_PART,
      comment: 'Snare A1 Short Book',
      layer1: { ...DEFAULT_LAYER, soundSource: 'sine', level: 90 },
      layer2: {
        ...DEFAULT_LAYER,
        soundSource: 'noiseHP',
        modType: 'random',
        ampEG: 'multi',
        level: 127,
      },
    },
  },
  {
    name: 'HH closed razor',
    part: {
      ...DEFAULT_PART,
      comment: 'HH closed razor',
      drive: 127,
      bitReduction: 127,
      fold: 127,
      layer1: { ...DEFAULT_LAYER, soundSource: 'saw', modType: 'random' },
      layer2: { ...DEFAULT_LAYER, soundSource: 'noiseHP', modType: 'lfo', ampEG: 'multi' },
    },
  },
];

export const WithPresets: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-presets',
    value: DEFAULT_PART,
    presets: mockPresets,
  },
};
