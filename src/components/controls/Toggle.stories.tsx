import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Toggle } from './Toggle';

const meta = {
  title: 'Controls/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: boolean }>();
    return (
      <Toggle
        {...args}
        value={value}
        onChange={(v) => {
          updateArgs({ value: v });
          args.onChange(v);
        }}
      />
    );
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { label: 'Pitch Quantization', value: false },
};

export const On: Story = {
  args: { label: 'Pitch Quantization', value: true },
};

export const Disabled: Story = {
  args: { label: 'Pitch Quantization', value: false, disabled: true },
};
