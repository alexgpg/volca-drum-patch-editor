import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { useArgs, useRef } from 'storybook/preview-api';
import { expect, fn, waitFor } from 'storybook/test';

import './volca-part';
import { applyPartChange } from '../lib/applyPartChange';
import type { PartPreset } from '../lib/partLibrary';
import { DEFAULT_LAYER } from '../types/layer';
import { DEFAULT_PART, type PartChange, type PartState } from '../types/part';

interface PartArgs {
  label: string;
  name: string;
  value: PartState;
  presets: PartPreset[];
  disabled: boolean;
  onChange: (change: PartChange) => void;
}

const meta = {
  title: 'Patch/Part',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    label: 'Part',
    name: 'part',
    value: DEFAULT_PART,
    presets: [],
    disabled: false,
    onChange: fn(),
  },
  // 'change' carries the PartChange union; fold it back with the same
  // reducer the app uses. A ref mirrors the latest folded state so
  // rapid-fire events chain on it, not on a pending arg echo.
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<PartArgs>();
    const latest = useRef(value);
    latest.current = value;
    return html`<volca-part
      .label=${args.label}
      .name=${args.name}
      .disabled=${args.disabled}
      .presets=${args.presets}
      .value=${value}
      @change=${(e: CustomEvent<PartChange>) => {
        const next = applyPartChange(latest.current, e.detail);
        latest.current = next;
        updateArgs({ value: next });
        args.onChange(e.detail);
      }}
    ></volca-part>`;
  },
} satisfies Meta<PartArgs>;

export default meta;
type Story = StoryObj<PartArgs>;

export const Default: Story = {
  args: { label: 'Part 1', name: 'p1' },
};

export const Aggressive: Story = {
  args: {
    label: 'Part 2',
    name: 'p2',
    value: {
      ...DEFAULT_PART,
      drive: 110,
      bitReduction: 80,
      fold: 96,
      dryGain: 24,
      layer1: { ...DEFAULT_LAYER, soundSource: 'noiseHP', level: 110 },
      layer2: {
        ...DEFAULT_LAYER,
        soundSource: 'noiseBP',
        modType: 'random',
        level: 100,
        modAmount: 90,
      },
    },
  },
};

export const Linked: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-linked',
    value: { ...DEFAULT_PART, linked: true },
  },
};

export const PitchQuantOn: Story = {
  args: {
    label: 'Part 1',
    name: 'p1-pq',
    value: { ...DEFAULT_PART, pitchQuant: true },
  },
};

export const Disabled: Story = {
  args: { label: 'Part 1', name: 'p1-disabled', disabled: true },
};

const mockPresets: PartPreset[] = [
  {
    name: 'Kick: A1-Book',
    part: {
      ...DEFAULT_PART,
      comment: 'Kick: A1-Book',
      drive: 24,
      fold: 78,
      pitchQuant: true,
      layer1: { ...DEFAULT_LAYER, soundSource: 'sine', level: 127, modAmount: 39 },
      layer2: { ...DEFAULT_LAYER, soundSource: 'sine', modType: 'envelope' },
    },
  },
  {
    name: 'Snare A1 Short Book',
    part: {
      ...DEFAULT_PART,
      comment: 'Snare A1 Short Book',
      layer1: { ...DEFAULT_LAYER, soundSource: 'sine', level: 90 },
      layer2: {
        ...DEFAULT_LAYER,
        soundSource: 'noiseHP',
        modType: 'random',
        ampEG: 'multi',
        level: 127,
      },
    },
  },
  {
    name: 'HH closed razor',
    part: {
      ...DEFAULT_PART,
      comment: 'HH closed razor',
      drive: 127,
      bitReduction: 127,
      fold: 127,
      layer1: { ...DEFAULT_LAYER, soundSource: 'saw', modType: 'random' },
      layer2: { ...DEFAULT_LAYER, soundSource: 'noiseHP', modType: 'lfo', ampEG: 'multi' },
    },
  },
];

export const WithPresets: Story = {
  args: { label: 'Part 1', name: 'p1-presets', presets: mockPresets },
  // The preset selection is derived, not remembered: picking an entry shows
  // it (once the applied state round-trips), and any edit that diverges from
  // the preset drops the select back to the placeholder.
  play: async ({ canvasElement }) => {
    const part = canvasElement.querySelector('volca-part')!;
    const root = part.shadowRoot!;
    const select = root.querySelector<HTMLSelectElement>('.part__preset-select')!;

    select.value = '1';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(select.value).toBe('1'));
    await waitFor(() => expect(part.value.comment).toBe('Snare A1 Short Book'));

    // Flip Pitch Quantization — the part no longer equals the preset.
    root.querySelector('.part__pq')!.shadowRoot!.querySelector('input')!.click();
    await waitFor(() => expect(select.value).toBe(''));
  },
};
