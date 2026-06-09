import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs, useRef } from 'storybook/preview-api';
import { expect, fn, waitFor } from 'storybook/test';

import './volca-kit';
import { applyPatchChange } from '../lib/applyPatchChange';
import { DEFAULT_PART } from '../types/part';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchChange,
  type PatchState,
} from '../types/patch';

const partCommented = (comment: string) => ({ ...DEFAULT_PART, comment });

const SAMPLE_KITS: PartialKit[] = [
  {
    comment: 'Sample Kit 1',
    parts: [partCommented('kick'), partCommented('snare'), partCommented('hat')],
  },
  {
    comment: 'Full Kit',
    parts: [
      partCommented('k'), partCommented('s'), partCommented('h'),
      partCommented('t'), partCommented('r'), partCommented('c'),
    ],
  },
];

interface KitArgs {
  value: KitState;
  kits: PartialKit[];
  disabled: boolean;
  onChange: (change: PatchChange) => void;
}

const meta = {
  title: 'Kit/Kit',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    value: DEFAULT_KIT,
    kits: SAMPLE_KITS,
    disabled: false,
    onChange: fn(),
  },
  // Same stale-closure guard as the Patch story: fold rapid events on the
  // latest reduced state, not on a pending arg echo.
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<KitArgs>();
    const latest = useRef(value);
    latest.current = value;
    return html`<volca-kit
      .disabled=${args.disabled}
      .kits=${args.kits}
      .value=${value}
      @change=${(e: CustomEvent<PatchChange>) => {
        const next = applyPatchChange(latest.current, e.detail);
        latest.current = next;
        updateArgs({ value: next });
        args.onChange(e.detail);
      }}
    ></volca-kit>`;
  },
} satisfies Meta<KitArgs>;

export default meta;
type Story = StoryObj<KitArgs>;

export const Default: Story = {
  // Derived kit selection: applying a library kit lights its entry up;
  // renaming the kit diverges from the entry and clears it.
  play: async ({ canvasElement }) => {
    const kit = canvasElement.querySelector('volca-kit')!;
    const root = kit.shadowRoot!;
    const select = root.querySelector<HTMLSelectElement>('.kit__preset-select')!;

    select.value = '0';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(select.value).toBe('0'));
    await waitFor(() => expect(kit.value.comment).toBe('Sample Kit 1'));

    const name = root.querySelector<HTMLInputElement>('.kit__comment')!;
    name.value = 'Sample Kit 1 (edited)';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(select.value).toBe(''));
  },
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
  args: { disabled: true },
};
