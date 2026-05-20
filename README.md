# Volca Drum Patch Editor

A web-based patch editor for the [Korg Volca Drum](https://www.korg.com/products/dj_dance_vj/volca_drum/) — a digital percussion synthesizer and drum machine. Edit patches from your browser using Web MIDI to send parameter changes directly to the device.

Inspired by [synthmata/volca-drum](https://synthmata.github.io/volca-drum/).

## Features

- Edit all six parts and both layers — every per-layer and per-part parameter the device exposes over MIDI.
- Live MIDI dispatch: pick an output, toggle Live on, and edits stream to the device as you move sliders.
- Link Layers per part — one set of controls drives both layers, using the device's "both layers" CCs.
- Shareable patch codes for individual layers and whole parts, with editable comments and one-click copy.
- LCD-accurate display values throughout the editor, matching what the hardware shows on its screen.
- Pitch Quantization toggle with a chromatic pitch picker when enabled.

## Requirements

- A browser with [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) support (Chrome, Edge, Opera).
- A Korg Volca Drum connected via MIDI.

## Development

```sh
pnpm install
pnpm dev
```

Built with React, TypeScript, and Vite.

## Storybook

Component stories are available for previewing UI in isolation — useful for checking individual controls and layouts without wiring up the full editor.

```sh
pnpm storybook
```

Opens at http://localhost:6006.

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — type-check and build for production
- `pnpm lint` — run ESLint
- `pnpm test` — run the unit test suite
- `pnpm preview` — preview the production build
- `pnpm storybook` — start Storybook on port 6006
- `pnpm build-storybook` — build a static Storybook bundle
