# Volca Drum Patch Editor

A web-based patch editor for the [Korg Volca Drum](https://www.korg.com/products/dj_dance_vj/volca_drum/) — a digital percussion synthesizer and drum machine. Edit patches from your browser using Web MIDI to send parameter changes directly to the device.

Inspired by [synthmata/volca-drum](https://synthmata.github.io/volca-drum/).

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
