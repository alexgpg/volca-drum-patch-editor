import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-layer';
import type { LayerChangeDetail, VolcaLayer } from './volca-layer';
import { DEFAULT_LAYER, type LayerState } from '../types/layer';

// Teach TSX about <volca-layer> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-layer': DetailedHTMLProps<HTMLAttributes<VolcaLayer>, VolcaLayer>;
    }
  }
}

interface LayerArgs {
  label: string;
  name: string;
  value: LayerState;
  disabled: boolean;
  pitchQuant: boolean;
  onChange: (param: keyof LayerState, value: LayerState[keyof LayerState]) => void;
  onReplace: (next: LayerState) => void;
}

const meta = {
  title: 'WC/Layer',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Layer',
    name: 'layer',
    value: DEFAULT_LAYER,
    disabled: false,
    pitchQuant: false,
    onChange: fn(),
    onReplace: fn(),
  },
  render: function Render(args) {
    const [{ label, name, value, disabled, pitchQuant }, updateArgs] =
      useArgs<LayerArgs>();
    const ref = useRef<VolcaLayer>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.label = label;
      el.name = name;
      el.disabled = disabled;
      el.pitchQuant = pitchQuant;
      el.value = value;
    }, [label, name, value, disabled, pitchQuant]);

    // 'change' carries {param, value}; 'replace' a whole decoded LayerState.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const { param, value: v } = (event as CustomEvent<LayerChangeDetail>).detail;
        updateArgs({ value: { ...el.value, [param]: v } });
        args.onChange(param, v);
      };
      const onReplace = (event: Event) => {
        const next = (event as CustomEvent<LayerState>).detail;
        updateArgs({ value: next });
        args.onReplace(next);
      };
      el.addEventListener('change', onChange);
      el.addEventListener('replace', onReplace);
      return () => {
        el.removeEventListener('change', onChange);
        el.removeEventListener('replace', onReplace);
      };
    }, [args, updateArgs]);

    return <volca-layer ref={ref} />;
  },
} satisfies Meta<LayerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Layer 1', name: 'p1l1' },
};

export const NoiseLayer: Story = {
  args: {
    label: 'Layer 2',
    name: 'p1l2',
    value: {
      ...DEFAULT_LAYER,
      soundSource: 'noiseHP',
      modType: 'random',
      ampEG: 'multi',
      level: 90,
      pitch: 80,
      modAmount: 64,
    },
  },
};

export const PitchQuantOn: Story = {
  args: { label: 'Layer 1', name: 'p1l1-qpi', pitchQuant: true },
};

export const Disabled: Story = {
  args: { label: 'Layer 1', name: 'p1l1-disabled', disabled: true },
};
