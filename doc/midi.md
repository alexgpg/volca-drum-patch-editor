# MIDI on the Korg Volca Drum

How the editor talks to the device, and why the addressing looks the
way it does. This is the source of truth for our `src/midi/` layer.

Sourced from, in order of authority:
1. **Korg Volca Drum MIDI Implementation Chart** (split channel,
   v1.00, 2019.2.20) — the device's contract.
2. The synthmata Volca Drum editor (`example.html`, `init_patch.js`)
   and its `ccynthmata` library — used to recover the per-option
   integer values for the compound selectors CC, which the official
   chart does not enumerate.

When the two disagree, the chart wins.

## TL;DR

- **Transport**: Web MIDI API (`navigator.requestMIDIAccess({ sysex: true })`).
  We send only — the chart shows the device receives CCs but does not
  transmit them.
- **Wire format**: standard 3-byte **Control Change** messages. No
  SysEx, no NRPN, no 14-bit pairs.
  ```
  [ 0xB0 | (channel - 1), ccNumber, value ]   // value, ccNumber: 0–127
  ```
- **Mode assumption**: split channel — one MIDI channel per Part.
  Factory default. The device also has a single-channel mode covered
  by a separate chart; we don't support it.
- **Reception requirement**: the device only acts on these CCs when
  the global parameter **`MIDI RX ShortMessage = ON`**. If a connected
  device "doesn't respond", check this first.

## Parts, Layers, Channels

| Concept | Range | What it is |
|---|---|---|
| **Part** | 1–6 | The six drum slots. Each Part lives on its own MIDI channel: Part *N* → channel *N* (`0xB0 | (N − 1)` as the CC status byte). |
| **Layer** | 1, 2 | Two independent voices per Part that get summed. Each layer has its own oscillator, modulator, envelope, level, pitch. |

A single layer is identified by `(part, slot)`, where `part` chooses
the MIDI channel and `slot` chooses which CCs to use.

## Per-Layer parameters

Each layer exposes **9 user-facing controls**:

- **3 categorical selectors** — Sound Source, Mod Type, Amp EG.
- **6 continuous sliders** — Level, Pitch, EG Attack, EG Release,
  Mod Amount, Mod Rate.

The 6 continuous controls map 1:1 to CCs. The 3 selectors are encoded
*together* into one CC — see "Compound selectors CC" below.

### CC numbers per layer parameter

The chart assigns three CCs to each per-layer parameter: one for
Layer 1, one for Layer 2, and a "both layers" version that writes to
both at once.

| Parameter   | Layer 1 | Layer 2 | Both | Chart name |
|---|---:|---:|---:|---|
| Selectors (sum, see below) | 14 | 15 | 16 | SELECT1 / SELECT2 / SELECT1-2 |
| Level       | 17 | 18 | 19 | LEVEL    |
| EG Attack   | 20 | 21 | 22 | EGATT    |
| EG Release  | 23 | 24 | 25 | EGREL    |
| Pitch       | 26 | 27 | 28 | PITCH    |
| Mod Amount  | 29 | 30 | 31 | MODAMT   |
| Mod Rate    | 46 | 47 | 48 | MODRATE  |

The "Both" CCs are useful for global commands like "raise the level
of this whole part by N" — one CC instead of two. Editing one specific
layer always uses the per-layer CC; we don't currently surface the
"both" CCs in the UI.

## Compound selectors CC (the encoding trick)

The three selectors don't get their own CCs. Instead, each option is
assigned a carefully-chosen integer, and **the sum** of the three
selected integers is sent as the value on CC 14 (Layer 1), CC 15
(Layer 2), or CC 16 (both layers). The device decodes the sum back
into three discrete choices.

The chart confirms a single CC per layer carries the SELECT function;
the per-option integers below come from synthmata's `example.html`
and produce the expected behaviour on the device.

| Group        | Option   | Value |
|---|---|---:|
| Sound Source | sine     | 0   |
|              | saw      | 26  |
|              | noise HP | 52  |
|              | noise LP | 77  |
|              | noise BP | 103 |
| Mod Type     | envelope | 0   |
|              | LFO      | 9   |
|              | random   | 18  |
| Amp EG       | AD       | 0   |
|              | exp      | 3   |
|              | multi    | 6   |

**Why this works.** Sound Source values are spaced by ≥ 24 (above the
next-tier max of 18 + 6), and Mod Type values are spaced by 9 (above
Amp EG's max of 6). The three components form non-overlapping decimal
"digits" so every combination yields a unique total. Sanity check:
- Combinations: 5 × 3 × 3 = 45.
- Maximum: 103 + 18 + 6 = 127 → fits a 7-bit CC.

**Encode:**
```ts
selectorsCC = SOURCE[soundSource] + MOD[modType] + ENV[ampEG]
```

**Decode** (for completeness — we don't read from the device, but
useful if/when applying a patch dump produced by synthmata):
- Take the largest `SOURCE` value ≤ `v`; that gives `soundSource`.
- Subtract it. Take the largest `MOD` value ≤ remainder; that gives
  `modType`. Subtract it.
- The rest equals one of `ENV`'s values; that gives `ampEG`.

## Per-Part parameters (outside the Layer)

Each Part has **7 controls** that apply to the whole Part (both
layers together). The Part component will own these.

| CC  | Name               | Type     | Notes |
|---:|---|---|---|
| 10  | Pan                | slider   | 0 = hard left, 64 = centre, 127 = hard right |
| 49  | Bit Reduction      | slider   | Lo-fi |
| 50  | Fold               | slider   | Wave folder amount |
| 51  | Drive              | slider   | Drive / saturation |
| 52  | Dry Gain           | slider   | Pre-resonator dry signal level |
| 103 | Send               | slider   | Send to the global waveguide |
| 53  | Pitch Quantization | toggle   | Off (`< 64`) / On (`≥ 64`); synthmata sends 0 or 127 |

These are sent on the channel of the affected Part (Part *N* →
channel *N*). Synthmata's `init_patch.js` confirms the six sliders
by repeating them in every Part's defaults; the toggle is defined in
`example.html` per Part but absent from `init_patch.js` (defaults to
Off in the device).

**Pitch Quantization (CC 53) is missing from the official chart**
(split-channel, v1.00, 2019.2.20). It is nonetheless a real
receivable parameter on the device — synthmata implements it and
real hardware responds. Treat the chart as incomplete on this point.

## Synth-wide parameters (outside any Part)

The Volca Drum has **one** waveguide resonator shared across all six
Parts. Its four controls live in synth-wide setup, **not** in
patches:

| CC  | Chart name      | Notes |
|---:|---|---|
| 116 | WAVEGUIDE MODEL | Resonator model selector — likely a banded enum, per-option values not verified |
| 117 | DECAY           | Waveguide decay |
| 118 | BODY            | Waveguide body |
| 119 | TUNE            | Waveguide tune |

These can be sent on any Part's channel (the device treats them
globally regardless). By convention we send them on **channel 1**,
matching synthmata — whose `init_patch.js` only carries CCs 116–119
in Part 1's entry, not the other five, because they don't need to
be repeated.

In our component tree these belong in a top-level `GlobalSettings`
panel alongside the MIDI port selector, not inside `Part`. They are
not saved as part of a patch.

## Notes on chart gaps

- **CC 53 (Pitch Quantization)** is a real per-Part parameter
  documented by synthmata and confirmed against hardware, but absent
  from the official chart. See "Per-Part parameters" above.

## Sending strategies

### Single-parameter edit

Whenever one slider or one radio changes, send exactly one CC:

- **Slider** changed: `[0xB0 | (part-1), SLIDER_CC[slot][param], value]`.
- **Selector** changed: recompute the sum and send `[0xB0 | (part-1),
  SELECTORS_CC[slot], sum]`. *One message, not three* — even though
  three logical fields could have changed.
- **Part-level** changed: `[0xB0 | (part-1), PART_CC[param], value]`.
- **Synth-wide** changed: `[0xB0, GLOBAL_CC[param], value]` (channel 1
  by convention).

### Full patch send

Used when an output is selected, when "Init" is clicked, and when a
saved patch is loaded. Walk every control and emit its CC. There is
no batching or SysEx dump — just a stream of CC messages.

For one Part: 7 CCs per layer × 2 + 7 part-level = 21 messages. For
all 6 parts: 126 messages, plus 4 synth-wide CCs sent once = 130. The
device handles this fine; no inter-message delay required.

### Throttling

`<input type="range">` fires `input` on every pixel of drag. Without
throttling, a fast drag can produce hundreds of CC messages per
second. Recommended: coalesce per-CC at 60–120 Hz in the dispatch
layer. Always send the *last* value on release so the device ends in
the right state.

## Defaults

From synthmata's `init_patch.js`. The per-Part values are identical
across all six parts; the synth-wide block is only recorded in Part 1
(because it doesn't need to be repeated).

**Per-Part (sent on the part's channel):**

```
PAN          (CC 10)  = 64    (centre)
SELECT1      (CC 14)  = 0     (sine + envelope + AD)
SELECT2      (CC 15)  = 0     (sine + envelope + AD)
LEVEL1       (CC 17)  = 127
LEVEL2       (CC 18)  = 127
EGATT1       (CC 20)  = 0
EGATT2       (CC 21)  = 0
EGREL1       (CC 23)  = 127
EGREL2       (CC 24)  = 127
PITCH1       (CC 26)  = 12
PITCH2       (CC 27)  = 18
MODAMT1      (CC 29)  = 64    (centre — likely bipolar)
MODAMT2      (CC 30)  = 64
MODRATE1     (CC 46)  = 0
MODRATE2     (CC 47)  = 0
BIT RED      (CC 49)  = 0
FOLD         (CC 50)  = 0
DRIVE        (CC 51)  = 0
DRY GAIN     (CC 52)  = 64
SEND         (CC 103) = 0
```

**Synth-wide (sent once, on channel 1 by convention):**

```
WAVEGUIDE MODEL  (CC 116) = 0
DECAY            (CC 117) = 0
BODY             (CC 118) = 0
TUNE             (CC 119) = 15
```

`MODAMT` defaulting to 64 strongly suggests a bipolar parameter
centred at 64 (≈ ±100 % when displayed). The chart does not document
this; the inference comes from synthmata's `hundred` display
transform.

## UI display transforms

The wire value is always 0–127, but the UI may render a friendlier
number. From `example.html`'s `data-displayvaluefunc`:

- **doubler** — applied to LEVEL, PITCH, EGATT, EGREL, MODRATE.
  Display = `value * 2` (with `127 → 255`). Suggests the device's
  internal range is 0–255 and the 7-bit CC is half-resolution.
- **hundred** — applied to MODAMT, PAN, DRY GAIN. Display ≈
  `((value − 64) / 64) × 100` rounded, giving roughly −100 … +100.
  Centred / bipolar parameters.
- **onoffer** — applied to PITCH QUANTIZATION. Display = `Off` if
  `value < 64`, `On` otherwise. Boolean, sent as 0 or 127.

These are display-only; the value sent on the wire is unchanged.

## Receiving from the device

The MIDI Implementation Chart shows **Transmitted = X** for every CC,
Note, Pitch Bend, Aftertouch, Program Change, and SysEx message. The
only outbound traffic is system-real-time (Clock, Start/Stop/Continue)
when the device acts as the clock master. We do not listen on a MIDI
input.

If we ever wanted to mirror hardware-knob moves into the UI, we
couldn't — not over MIDI. (The device may have a separate audio-only
knob recording feature that doesn't touch MIDI; that's outside this
layer.)

## Discrepancies between synthmata and the official chart

| Source     | What it says            | What we use |
|---|---|---|
| synthmata `example.html` | Defines CC 53 as per-Part Pitch Quantization toggle | **Keep.** Chart is incomplete; hardware responds. |
| synthmata `example.html` | All three Layer-1 selector groups share `data-cclsb="14"`, all three Layer-2 groups share `data-cclsb="15"` | Confirmed by chart (one SELECT CC per layer). |
| synthmata calls CC 103 "wave folder" (in some labels) | — | Chart says CC 103 = SEND; FOLD is CC 50. |

## References

- Korg Volca Drum MIDI Implementation Chart (split channel) —
  https://cdn.korg.com/us/support/download/files/aa0a404eb2b0fa59873677d825cc272e.pdf
- Korg Volca Drum support page — https://www.korg.com/us/support/download/manual/0/809/4259/
- Synthmata Volca Drum editor — https://synthmata.github.io/volca-drum/
- ccynthmata library — https://github.com/synthmata/ccynthmata
