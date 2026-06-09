import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-icon-radio-group';
import type { IconRadioOption, VolcaIconRadioGroup } from './volca-icon-radio-group';

// Teach TSX about <volca-icon-radio-group> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-icon-radio-group': DetailedHTMLProps<
        HTMLAttributes<VolcaIconRadioGroup>,
        VolcaIconRadioGroup
      >;
    }
  }
}

interface RadioArgs {
  label: string;
  name: string;
  value: string;
  options: IconRadioOption[];
  disabled: boolean;
  onChange: (value: string) => void;
}

const meta = {
  title: 'WC/IconRadioGroup',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { disabled: false, onChange: fn() },
  render: function Render(args) {
    const [{ label, name, value, options, disabled }, updateArgs] =
      useArgs<RadioArgs>();
    const ref = useRef<VolcaIconRadioGroup>(null);

    // Property in: scalars first, then the object-array `options` (which can
    // only ever be a property) so the list builds with the right name + value.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.label = label;
      el.name = name;
      el.disabled = disabled;
      el.value = value;
      el.options = options;
    }, [label, name, value, options, disabled]);

    // Event out: detail is the chosen string value.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const v = (event as CustomEvent<string>).detail;
        updateArgs({ value: v });
        args.onChange(v);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return (
      <div style={{ width: 360 }}>
        <volca-icon-radio-group ref={ref} />
      </div>
    );
  },
} satisfies Meta<RadioArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoundSourceGroup: Story = {
  args: {
    label: 'Sound Source',
    name: 'sound-source',
    value: 'sine',
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'saw', label: 'Saw' },
      { value: 'noiseHP', label: 'HP' },
      { value: 'noiseLP', label: 'LP' },
      { value: 'noiseBP', label: 'BP' },
    ],
  },
};

export const ModTypeGroup: Story = {
  args: {
    label: 'Mod Type',
    name: 'mod-type',
    value: 'envelope',
    options: [
      { value: 'envelope', label: 'Env' },
      { value: 'lfo', label: 'LFO' },
      { value: 'random', label: 'Rnd' },
    ],
  },
};

export const AmpEGGroup: Story = {
  args: {
    label: 'Amp EG',
    name: 'amp-eg',
    value: 'ad',
    options: [
      { value: 'ad', label: 'AD' },
      { value: 'exp', label: 'Exp' },
      { value: 'multi', label: 'Multi' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    label: 'Sound Source',
    name: 'sound-source-disabled',
    value: 'sine',
    disabled: true,
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'saw', label: 'Saw' },
      { value: 'noiseHP', label: 'HP' },
    ],
  },
};
