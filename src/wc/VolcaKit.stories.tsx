import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-kit';
import type { VolcaKit } from './volca-kit';
import { applyPatchChange } from '../lib/applyPatchChange';
import { DEFAULT_PART } from '../types/part';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchChange,
  type PatchState,
} from '../types/patch';

// Teach TSX about <volca-kit> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-kit': DetailedHTMLProps<HTMLAttributes<VolcaKit>, VolcaKit>;
    }
  }
}

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
  title: 'WC/Kit',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    value: DEFAULT_KIT,
    kits: SAMPLE_KITS,
    disabled: false,
    onChange: fn(),
  },
  render: function Render(args) {
    const [{ value, kits, disabled }, updateArgs] = useArgs<KitArgs>();
    const ref = useRef<VolcaKit>(null);
    // Same stale-closure guard as the Patch story: fold rapid events on the
    // latest reduced state, not on a pending arg echo.
    const latest = useRef(value);
    latest.current = value;

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.disabled = disabled;
      el.kits = kits;
      el.value = value;
    }, [value, kits, disabled]);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const c = (event as CustomEvent<PatchChange>).detail;
        const next = applyPatchChange(latest.current, c);
        latest.current = next;
        updateArgs({ value: next });
        args.onChange(c);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return <volca-kit ref={ref} />;
  },
} satisfies Meta<KitArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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
