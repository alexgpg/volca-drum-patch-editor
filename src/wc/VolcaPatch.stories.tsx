import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-patch';
import type { VolcaPatch } from './volca-patch';
import { applyPartChange } from '../lib/applyPartChange';
import type { PartPreset } from '../lib/partLibrary';
import { DEFAULT_PART } from '../types/part';
import {
  DEFAULT_PATCH,
  type PartScopedChange,
  type PatchState,
} from '../types/patch';

// Teach TSX about <volca-patch> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-patch': DetailedHTMLProps<HTMLAttributes<VolcaPatch>, VolcaPatch>;
    }
  }
}

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
  title: 'WC/Patch',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    value: DEFAULT_PATCH,
    presets: [],
    disabled: false,
    onChange: fn(),
  },
  render: function Render(args) {
    const [{ value, presets, disabled }, updateArgs] = useArgs<PatchArgs>();
    const ref = useRef<VolcaPatch>(null);
    // Mirror the latest folded state so rapid-fire events chain on it,
    // not on a value the async arg echo hasn't delivered yet.
    const latest = useRef(value);
    latest.current = value;

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.disabled = disabled;
      el.presets = presets;
      el.value = value;
    }, [value, presets, disabled]);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const c = (event as CustomEvent<PartScopedChange>).detail;
        const i = c.partIndex - 1;
        const next = [...latest.current] as Tuple6;
        next[i] = applyPartChange(latest.current[i], c.change);
        latest.current = next;
        updateArgs({ value: next });
        args.onChange(c);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return <volca-patch ref={ref} />;
  },
} satisfies Meta<PatchArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

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
