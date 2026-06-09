import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import './volca-patch-code';
import type { VolcaPatchCode } from './volca-patch-code';

interface PatchCodeArgs {
  value: string;
  placeholder: string;
  disabled: boolean;
  onApply: (raw: string) => void;
}

const meta = {
  title: 'Controls/PatchCode',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: 'vP1:7F3A2B10',
    placeholder: 'vP1:…',
    disabled: false,
    onApply: fn(),
  },
  // 'apply' is cancelable: accept by setting el.value, reject via
  // preventDefault(). Demo validator: a code must start with "vP" (real
  // Part decoding lives in lib/patchCodec — here we only exercise the paths).
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<PatchCodeArgs>();
    return html`<div style="width: 360px">
      <volca-patch-code
        .placeholder=${args.placeholder}
        .disabled=${args.disabled}
        .value=${value}
        @apply=${(e: CustomEvent<string>) => {
          const raw = e.detail;
          args.onApply(raw);
          if (/^vP/i.test(raw.trim())) {
            const canonical = raw.trim();
            (e.target as VolcaPatchCode).value = canonical;
            updateArgs({ value: canonical });
          } else {
            e.preventDefault();
          }
        }}
      ></volca-patch-code>
    </div>`;
  },
} satisfies Meta<PatchCodeArgs>;

export default meta;
type Story = StoryObj<PatchCodeArgs>;

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
