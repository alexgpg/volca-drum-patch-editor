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

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — type-check and build for production
- `pnpm lint` — run ESLint
- `pnpm preview` — preview the production build

## TODO

- Linked-layers MIDI dispatch optimisation: when `PartState.linked` is true, send one "both layers" CC (16, 19, 22, 25, 28, 31, 48 — see `doc/midi.md`) instead of two per-layer CCs. Purely a wire-side change in the future MIDI dispatch hook; the UI mirroring is already in place.
