import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Kit } from './Kit';
import { applyPatchChange } from '../../lib/applyPatchChange';
import { DEFAULT_PART } from '../../types/part';
import { DEFAULT_KIT, type KitState, type PatchState } from '../../types/patch';

const partCommented = (comment: string) => ({ ...DEFAULT_PART, comment });

const meta = {
  title: 'Kit/Kit',
  component: Kit,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: KitState }>();
    // Same stale-closure guard as Patch.stories: a ref mirrors `value`
    // so rapid edits chain on the latest reduced state, not the render's.
    const ref = useRef(value);
    ref.current = value;
    return (
      <Kit
        {...args}
        value={value}
        onChange={(c) => {
          const next = applyPatchChange(ref.current, c);
          ref.current = next;
          updateArgs({ value: next });
          args.onChange(c);
        }}
      />
    );
  },
} satisfies Meta<typeof Kit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: DEFAULT_KIT },
};

export const WithComment: Story = {
  args: { value: { ...DEFAULT_KIT, comment: 'Funky Drums' } },
};

export const WithPartComments: Story = {
  args: {
    value: {
      comment: 'House classics',
      parts: [
        partCommented('kick'),
        partCommented('snare'),
        partCommented('hat'),
        partCommented('tom'),
        partCommented('rim'),
        partCommented('cym'),
      ] as unknown as PatchState,
    },
  },
};

export const Disabled: Story = {
  args: { value: DEFAULT_KIT, disabled: true },
};
