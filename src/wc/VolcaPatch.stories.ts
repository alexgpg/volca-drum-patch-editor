import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs, useRef } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-patch';
import { applyPartChange } from '../lib/applyPartChange';
import type { PartPreset } from '../lib/partLibrary';
import { DEFAULT_PART } from '../types/part';
import {
  DEFAULT_PATCH,
  type PartScopedChange,
  type PatchState,
} from '../types/patch';

type Tuple6 = [
  PatchState[0],
  PatchState[1],
  PatchState[2],
  PatchState[3],
  PatchState[4],
  PatchState[5],
];

interface PatchArgs {
  value: PatchState;
  presets: PartPreset[];
  disabled: boolean;
  onChange: (change: PartScopedChange) => void;
}

const meta = {
  title: 'Patch/Patch',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    value: DEFAULT_PATCH,
    presets: [],
    disabled: false,
    onChange: fn(),
  },
  // Mirror the latest folded state in a ref so rapid-fire events chain on
  // it, not on a value the async arg echo hasn't delivered yet.
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<PatchArgs>();
    const latest = useRef(value);
    latest.current = value;
    return html`<volca-patch
      .disabled=${args.disabled}
      .presets=${args.presets}
      .value=${value}
      @change=${(e: CustomEvent<PartScopedChange>) => {
        const c = e.detail;
        const i = c.partIndex - 1;
        const next = [...latest.current] as Tuple6;
        next[i] = applyPartChange(latest.current[i], c.change);
        latest.current = next;
        updateArgs({ value: next });
        args.onChange(c);
      }}
    ></volca-patch>`;
  },
} satisfies Meta<PatchArgs>;

export default meta;
type Story = StoryObj<PatchArgs>;

export const Default: Story = {};

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
  args: { disabled: true },
};
