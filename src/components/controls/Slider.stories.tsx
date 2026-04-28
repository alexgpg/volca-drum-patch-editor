import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Slider } from './Slider';

const meta = {
  title: 'Controls/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: number }>();
    return (
      <div style={{ width: 360 }}>
        <Slider
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
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

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
