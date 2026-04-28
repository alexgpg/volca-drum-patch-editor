import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { IconRadioGroup } from './IconRadioGroup';
import type { SoundSource, ModType, AmpEG } from '../../types/layer';

const meta = {
  title: 'Controls/IconRadioGroup',
  component: IconRadioGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: string }>();
    return (
      <div style={{ width: 360 }}>
        <IconRadioGroup
          {...args}
          value={value}
          onChange={(v) => {
            updateArgs({ value: v });
            args.onChange(v);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof IconRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoundSourceGroup: Story = {
  args: {
    label: 'Sound Source',
    name: 'sound-source',
    value: 'sine' satisfies SoundSource,
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
    value: 'envelope' satisfies ModType,
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
    value: 'ad' satisfies AmpEG,
    options: [
      { value: 'ad', label: 'AD' },
      { value: 'exp', label: 'Exp' },
      { value: 'multi', label: 'Multi' },
    ],
  },
};
