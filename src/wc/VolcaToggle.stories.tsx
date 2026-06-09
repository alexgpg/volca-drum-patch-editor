import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-toggle';
import type { VolcaToggle } from './volca-toggle';

// Teach TSX about <volca-toggle>. React 19 keeps JSX typings on the `react`
// module, so we augment there; DetailedHTMLProps/HTMLAttributes resolve to
// react's own types inside the augmentation.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-toggle': DetailedHTMLProps<HTMLAttributes<VolcaToggle>, VolcaToggle>;
    }
  }
}

interface ToggleArgs {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

const meta = {
  title: 'WC/Toggle',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Link Layers',
    checked: false,
    disabled: false,
    onChange: fn(),
  },
  // The element is driven imperatively via a ref: properties in, `change`
  // event out. This is the bridge React 19 gives us during the migration —
  // see MIGRATION.md ("Storybook during the migration").
  render: function Render(args) {
    const [{ label, checked, disabled }, updateArgs] = useArgs<ToggleArgs>();
    const ref = useRef<VolcaToggle>(null);

    // Property in: mirror the current args onto the element, the Web Component
    // equivalent of React re-rendering with new props.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.label = label;
      el.checked = checked;
      el.disabled = disabled;
    }, [label, checked, disabled]);

    // Event out: feed `change` back into the control (so the knob tracks
    // clicks) and into the Actions panel.
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onChange = (event: Event) => {
        const value = (event as CustomEvent<boolean>).detail;
        updateArgs({ checked: value });
        args.onChange(value);
      };
      el.addEventListener('change', onChange);
      return () => el.removeEventListener('change', onChange);
    }, [args, updateArgs]);

    return <volca-toggle ref={ref} />;
  },
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { label: 'Pitch Quantization', checked: false },
};

export const On: Story = {
  args: { label: 'Pitch Quantization', checked: true },
};

export const Disabled: Story = {
  args: { label: 'Pitch Quantization', disabled: true },
};
