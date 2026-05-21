import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Patch } from './Patch';
import { applyPartChange } from '../../lib/applyPartChange';
import { DEFAULT_PART } from '../../types/part';
import { DEFAULT_PATCH, type PatchState } from '../../types/patch';

type Tuple6 = [
  PatchState[0],
  PatchState[1],
  PatchState[2],
  PatchState[3],
  PatchState[4],
  PatchState[5],
];

const meta = {
  title: 'Patch/Patch',
  component: Patch,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: PatchState }>();
    // Mirror value in a ref so rapid-fire onChange calls (e.g. fast
    // typing in a comment field) each build their `next` on top of
    // the previously-built one, not on the stale render closure.
    const ref = useRef(value);
    ref.current = value;
    return (
      <Patch
        {...args}
        value={value}
        onChange={(c) => {
          const i = c.partIndex - 1;
          const next = [...ref.current] as Tuple6;
          next[i] = applyPartChange(ref.current[i], c.change);
          ref.current = next;
          updateArgs({ value: next });
          args.onChange(c);
        }}
      />
    );
  },
} satisfies Meta<typeof Patch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: DEFAULT_PATCH },
};

export const WithComments: Story = {
  args: {
    value: [
      { ...DEFAULT_PART, comment: 'kick' },
      { ...DEFAULT_PART, comment: 'snare' },
      { ...DEFAULT_PART, comment: 'hat' },
      { ...DEFAULT_PART, comment: 'tom' },
      { ...DEFAULT_PART, comment: 'rim' },
      { ...DEFAULT_PART, comment: 'cym' },
    ],
  },
};

export const Disabled: Story = {
  args: { value: DEFAULT_PATCH, disabled: true },
};
