import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { PitchPicker } from './PitchPicker';

const meta = {
  title: 'Controls/PitchPicker',
  component: PitchPicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: number }>();
    return (
      <div style={{ width: 240 }}>
        <PitchPicker
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
} satisfies Meta<typeof PitchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

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
