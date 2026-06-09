import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-patch-code';
import type { VolcaPatchCode } from './volca-patch-code';

// Teach TSX about <volca-patch-code> (see VolcaToggle.stories for why).
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX intrinsic typings must live in a namespace
  namespace JSX {
    interface IntrinsicElements {
      'volca-patch-code': DetailedHTMLProps<
        HTMLAttributes<VolcaPatchCode>,
        VolcaPatchCode
      >;
    }
  }
}

interface PatchCodeArgs {
  value: string;
  placeholder: string;
  disabled: boolean;
  onApply: (raw: string) => void;
}

const meta = {
  title: 'WC/PatchCode',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: 'vP1:7F3A2B10',
    placeholder: 'vP1:…',
    disabled: false,
    onApply: fn(),
  },
  render: function Render(args) {
    const [{ value, placeholder, disabled }, updateArgs] =
      useArgs<PatchCodeArgs>();
    const ref = useRef<VolcaPatchCode>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.placeholder = placeholder;
      el.disabled = disabled;
      el.value = value;
    }, [value, placeholder, disabled]);

    // 'apply' is cancelable: accept by setting el.value, reject via
    // preventDefault(). Demo validator: a code must start with "vP" (real
    // Part decoding lives in lib/patchCodec — here we only exercise the paths).
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onApply = (event: Event) => {
        const raw = (event as CustomEvent<string>).detail;
        args.onApply(raw);
        if (/^vP/i.test(raw.trim())) {
          const canonical = raw.trim();
          el.value = canonical;
          updateArgs({ value: canonical });
        } else {
          event.preventDefault();
        }
      };
      el.addEventListener('apply', onApply);
      return () => el.removeEventListener('apply', onApply);
    }, [args, updateArgs]);

    return (
      <div style={{ width: 360 }}>
        <volca-patch-code ref={ref} />
      </div>
    );
  },
} satisfies Meta<PatchCodeArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: '' },
};

// A long code wraps and the textarea auto-grows to fit.
export const LongCode: Story = {
  args: {
    value:
      'vP1:7F3A2B10C4D5E6F7A8B9C0D1E2F30415263748596A7B8C9DAEBFC0D1E2F3A4B5',
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
