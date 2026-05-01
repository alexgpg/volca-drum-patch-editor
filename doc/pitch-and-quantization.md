# Pitch and Pitch Quantization on the Volca Drum

Research notes for melodic playing of the Volca Drum: what Pitch
Quantization (QPI) does, how the underlying pitch CCs behave, the
device's chromatic display grid, and the (separate) question of how
those displayed notes relate to actual acoustic frequency.

## Pitch CCs (recap)

The device exposes three CCs for layer pitch on each Part's channel
(see `doc/midi.md` for the full chart):

| CC | Function                       |
|---:|---|
| 26 | Layer 1 pitch                  |
| 27 | Layer 2 pitch                  |
| 28 | Both layers (pitch tracking)   |

All accept 0–127. The device's internal pitch range is 0–255 (twice
the CC resolution), reachable in the editor display via the `doubler`
function: `display = cc * 2`, with the special case `cc = 127 →
display = 255`. **Odd internal pitch values are not addressable by
CC** because every CC step lands on an even unit; reachable values
are `0, 2, 4, …, 252, 255` (128 entries).

## What QPI does

A per-Part on/off toggle on **CC 53** (value `< 64` = Off, `≥ 64` =
On). Manual gives only this:

> **QPI: enable pitch quantization (semitone)**

Added in firmware **1.14** (post-launch). When On:

- The device's PITCH knob switches its on-screen display from a
  number to a **note name** (see "Display labels" below).
- Incoming pitch CC values still flow through the same physical pitch
  engine; the visible difference is the labeled display and a slight
  rounding behaviour.
- Internal sequencer adds glide between successive different notes;
  external CC pitch input is stepped (no portamento).

CC 53 is missing from the official 2019.2.20 chart but is real on the
hardware and used by synthmata, VOLDRED, and others. It's recorded as
a discrepancy in `doc/midi.md`.

## Hardware control

How to toggle QPI manually on the unit:

```
1. Press EDIT/STEP
2. Turn SELECT PARAM until the display shows "QPI"
3. Turn LEVEL [VALUE] fully right
```

Each of the six Parts has its own QPI flag, addressed on the part's
channel.

## Two grids: nominal (device labels) vs acoustic (frequency)

**There are two different mappings from a pitch value to a "note"**,
and they disagree. Conflating them is the source of every confusion
in this area.

The reason both exist comes from when each was characterised. The
device shipped without QPI; for melodic playing in those early days
**OscillatorSink hand-tuned each pitch value by ear / tuner** and
labelled it with the closest concert-pitch note (his "acoustic
grid", section B below). Korg later shipped firmware **1.14**, which
added QPI and made the LCD display chromatic note names directly —
but those labels follow a **clean linear partition of 0–255 into
semitones** (the "nominal grid", section A) rather than the device's
actual frequency response. So today's users navigate by the LCD's
nominal labels; OscillatorSink's older table is still the reference
for tuning-accurate playing.

A pitch value labelled `A4` on the modern LCD is therefore *not*
guaranteed to play 440 Hz; conversely, OscillatorSink's "in-tune A4"
sits at a different pitch value than the LCD's `A4`.

### A. Nominal grid — what the device's LCD shows

**Linear and predictable.** Empirically verified across the entire
0–255 range (`doc/pitch-labels.csv`):

- **Anchor**: `C0` is at pitch value **26**.
- **Spacing**: every C lies +24 pitch units higher than the previous
  one (`C1` at 50, `C2` at 74, … `C9` at 242). 24 pitch units = 12
  semitones, so **2 pitch units = 1 semitone**.
- **Pattern is perfectly linear** all the way from `C-1` (pitch 2) to
  `F⁰9` (pitch 255 — the top endpoint, which fits the grid with no
  wraparound).
- **Source-independent**: the LCD shows the same label for a given
  pitch value regardless of whether the layer is sine, saw, or any of
  the three noise sources. The label depends only on the pitch CC
  value, not on what the user actually hears.

#### LCD format rules

The note display is at most 3 characters wide. The format is
`<letter>` + optional `⁰` (sharp marker) + `<octave>`, with one
truncation rule for negative octaves:

| Pattern | Example | LCD shows |
|---|---|---|
| natural, octave 0+ | C in octave 0 (pitch 26) | `C0` |
| natural, octave −1 | C in octave −1 (pitch 2) | `C-1` |
| sharp, octave 0+ | C♯ in octave 0 (pitch 28) | `C⁰0` |
| sharp, octave −1 | C♯ in octave −1 (pitch 4) | `C⁰-` (truncated from `C⁰-1`; the visible `-` is the leading dash of `-1`, not a detuning marker) |

The lowercase `d` and `b` we see in transcriptions are font
artifacts — the device's small LCD doesn't distinguish upper/lower
case for those letters. They're still D and B respectively.

#### Edge cases

- **Pitch values 0 and 1 (effectively just 0, since 1 is unreachable
  via CC) clip to `C-1`** — the device floors below the chromatic
  grid's lowest displayable note.
- **Pitch 255** is `F⁰9` — the chromatic grid extends cleanly to the
  top with no special case. The "skip" from 252 → 255 (instead of
  253, 254) just means three semitones aren't reachable on the wire
  (E♯9-ish through F♯9-ish).

#### Formula

```ts
function pitchToLabel(pitch: number): string {
  if (pitch < 2) return 'C-1';                  // clip floor
  const semitonesFromC0 = Math.floor((pitch - 26) / 2);
  const octave = Math.floor(semitonesFromC0 / 12);
  const idx    = ((semitonesFromC0 % 12) + 12) % 12;
  const note   = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][idx];
  // …then apply LCD format (substitute ⁰ for ♯, truncate `-1` octave)
}
```

Reference data: `doc/pitch-labels.csv` (128 reachable values, all
filled empirically; helper code in `src/lib/devicePitchLabels.ts`).

### B. Acoustic grid — what your ears or a tuner hear

**Non-linear**, and characterised **before QPI existed** (so without
the LCD's nominal labels to lean on). [OscillatorSink's
research](https://github.com/oscillatorsink/volca-drum-melody-research)
hand-tuned each pitch value against a frequency reference and
recorded which were within ±11 cents of an equal-tempered note. His
data shows the device's *actual* pitch response is **exponential**
(like an analog VCO), so the number of CC steps per acoustic octave
grows as you go up:

| Acoustic octave span | CC steps |
|---|---:|
| A2 → A3 | ~12 |
| A4 → A5 | ~24 |
| A5 → A6 | ~33 |

Most CC values land *between* equal-tempered notes acoustically. Only
~30 of the 128 reachable values come within his ±11 cent tolerance of
a note name; he listed those in his repo.

### Why the two disagree

The device's LCD labels each pitch CC value by **dividing the 0–255
range linearly into 12 semitones × 8+ octaves**. That's a nominal
grid — convenient for the user to navigate, but it doesn't reflect
acoustic reality, because the actual pitch curve is exponential.

The two groups answered two different questions:

- **OscillatorSink (pre-QPI)** asked "which pitch values land *in
  tune* with concert pitch?" and got a sparse, irregular set of CC
  values bunched up in the upper octaves where his ear cared most.
- **The device's LCD (post-QPI)** answers "where in a clean
  chromatic grid does this CC value sit?" and gives an evenly-spaced
  nominal answer for every reachable value.

So a value the LCD calls `A4` is unlikely to play 440 Hz; conversely,
the value OscillatorSink calls "in-tune A4" is labelled differently
on the modern LCD.

**For this editor.** The natural mental model now is the LCD's
labels — that's what a user sees when they look down at their
hardware while editing. We mirror those (`src/lib/devicePitchLabels.ts`).
OscillatorSink's table remains the reference if you want to play in
tune alongside other instruments and are willing to chase the
device's exponential curve manually.

## Sources

- **`doc/pitch-labels.csv`** — empirical 128-row LCD-label table for
  this codebase, source-independent.
- **OscillatorSink's research repo** —
  https://github.com/oscillatorsink/volca-drum-melody-research
  - `notes.md` — converted note↔CC table by acoustic frequency
  - `VolcaDrum-Pitches-Raw.csv` — raw cents-from-target measurements
- **OscillatorSink (X / Twitter)** — original 1.14 update thread
  describing QPI behaviour:
  https://x.com/oscillatorsink/status/1171529038050910209
- **Korg Volca Drum Owner's Manual (EFGSCJ)** —
  https://cdn.korg.com/us/support/download/files/c65c033ee08932b5bd69303ebf7f31b0.pdf
- **Korg Volca Drum MIDI Implementation Chart (split channel,
  2019.2.20)** —
  https://cdn.korg.com/us/support/download/files/aa0a404eb2b0fa59873677d825cc272e.pdf
- **MATRIXSYNTH article on QPI** —
  https://www.matrixsynth.com/2019/10/volca-drum-whats-pitch-quantization.html
- **Elektronauts thread (page 16, melodic-play discussion)** —
  https://www.elektronauts.com/t/korg-volca-drum/71041?page=16
- **VOLDRED (TouchOSC editor) — QPI handling reference** —
  https://github.com/neilbaldwin/VOLDRED
- **Retrokits RK-002 — third-party MIDI cable / firmware platform**
  with private Volca Drum melodic-mode firmware:
  https://duy.retrokits.com/

## Implementation in this codebase

- `src/lib/devicePitchLabels.ts` — `pitchToLabel(pitch: 0..255)` and
  `labelToPitch(label: string)`, deriving labels from the formula
  above. Pure functions, no React.
- `src/lib/devicePitchLabels.test.ts` — round-trip + boundary tests.
- Slider integration (mirror the device label in the value box of the
  pitch slider) is a separate UI commit and not yet wired in.
