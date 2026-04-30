# Patch-code text format

A compact, human-readable text encoding for one Layer or one Part of a
Volca Drum patch. Used by the Copy/Paste fields in the editor so users
can share, save, or hand-edit a patch as a single line.

The codec is implemented in `src/lib/patchCodec.ts`.

## Goals

- **Short.** Round-trip a Part in ~70 characters, a Layer in ~25, when
  there is no comment.
- **Human-readable.** No URI-encoding, no base64; all ASCII.
- **Hand-editable.** A user who reads `doc/midi.md` can tweak a value
  with a text editor.
- **Self-describing.** The leading `vL1:` / `vP1:` distinguishes the
  two scopes so a Layer string pasted into a Part field gets rejected
  cleanly (and vice versa).
- **Versioned.** The trailing `1` is a format version. Future
  breaking changes bump it; old strings stay parseable until we drop
  support.

## Grammar

```
layer-code    = "vL1:" layer-section
part-code     = "vP1:" part-head ";" layer-section ";" layer-section [ "|" part-comment ]

layer-section = layer-body [ "~" layer-comment ]
layer-body    = source "," mod "," env ","
                level "," pitch "," egAttack "," egRelease ","
                modAmount "," modRate

part-head     = pan "," send "," pitchQuant ","
                drive "," bitReduction "," fold "," dryGain ","
                linked
```

## Field encoding

### Layer enums (single-letter codes)

| Field        | Code | Meaning              |
|---|---|---|
| `source`     | `s`  | Sine                 |
|              | `w`  | Saw                  |
|              | `h`  | Noise HP             |
|              | `l`  | Noise LP             |
|              | `b`  | Noise BP             |
| `mod`        | `e`  | Envelope             |
|              | `l`  | LFO                  |
|              | `r`  | Random               |
| `env`        | `a`  | AD                   |
|              | `e`  | Exp                  |
|              | `m`  | Multi                |

The codes overlap (`l` is shared by `noiseLP` and `lfo`; `e` by
`envelope` and `exp`). They're disambiguated by **position only** —
the parser knows the first letter is `source`, the second is `mod`,
the third is `env`. **Never reorder these fields without bumping the
version prefix.**

### Numeric fields

All slider values are 0–127 integers (the device's MIDI range).

| Field         | Range  | Notes                              |
|---|---|---|
| `level`       | 0–127  | Layer mix level                    |
| `pitch`       | 0–127  | Layer pitch                        |
| `egAttack`    | 0–127  |                                    |
| `egRelease`   | 0–127  |                                    |
| `modAmount`   | 0–127  | Bipolar; 64 = centre               |
| `modRate`     | 0–127  |                                    |
| `pan`         | 0–127  | 0 left, 64 centre, 127 right       |
| `send`        | 0–127  | Send to global waveguide           |
| `drive`       | 0–127  | Wave-folder section                |
| `bitReduction`| 0–127  | Wave-folder section                |
| `fold`        | 0–127  | Wave-folder section                |
| `dryGain`     | 0–127  | Wave-folder section                |

### Boolean fields

Encoded as `0` or `1` in the Part head:

| Field        | 0           | 1            |
|---|---|---|
| `pitchQuant` | Off         | On           |
| `linked`     | independent | linked       |

### Comments

Both layer and part can carry a free-text comment:

- **Layer comment** is suffixed to the layer body with `~`. Optional;
  the `~` is omitted entirely when the comment is empty.
- **Part comment** is suffixed to the whole part with `|`. Optional;
  the `|` is omitted entirely when the comment is empty.

Restrictions (silently stripped by the encoder; rejected by the
decoder if found in the wrong place):

- **Layer comments must not contain `;` or `|`** — those would be
  parsed as the part-section separator or the part-comment delimiter.
- **Part comments must not contain `|`** — a second `|` is ambiguous.

Layer comments may contain `,`, `~`, spaces, and any other text. Part
comments may also contain `;` and `~` since they sit at the very end
of the string and are extracted via `indexOf('|')`.

## Examples

**Default Layer** (no comment):

```
vL1:s,e,a,100,64,0,64,0,64
```

**Layer with a comment**:

```
vL1:b,r,m,90,80,12,40,100,80~hat body
```

(noise BP source, random mod, multi env, then the six sliders, then
the comment.)

**Default Part** (no comment, both layers default):

```
vP1:64,0,0,0,0,0,64,0;s,e,a,100,64,0,64,0,64;s,e,a,100,64,0,64,0,64
```

(head: `pan=64, send=0, pitchQuant=0, drive=0, bitReduction=0, fold=0, dryGain=64, linked=0`.)

**Full Part with comments on every level**:

```
vP1:64,32,1,80,40,60,50,0;w,l,m,90,72,5,30,80,100~snare body;b,r,e,60,80,0,40,127,90~rattle|punchy snare
```

| Section                                             | Meaning                              |
|---|---|
| `vP1:`                                              | Part code, version 1                 |
| `64,32,1,80,40,60,50,0`                             | head: pan/send/pq/drive/bitred/fold/drygain/linked |
| `w,l,m,90,72,5,30,80,100~snare body`                | Layer 1 body + comment "snare body" |
| `b,r,e,60,80,0,40,127,90~rattle`                    | Layer 2 body + comment "rattle"     |
| `\|punchy snare`                                    | part comment                         |

## Versioning

The prefix carries a single integer version (`vL1`, `vP1`). When the
format changes in a backwards-incompatible way:

1. Bump to `vL2` / `vP2` (etc.) for new encodings.
2. Keep parsing the old version until adoption stabilises.
3. The decoder dispatches on the prefix; mismatched-prefix strings
   are rejected (return `null`) so callers can show "unrecognised
   patch code" without false-positive parsing.

Adding new fields *at the end* of an existing scope is technically
non-breaking only if older readers tolerate trailing extras — our
current parser does not (`split(',')` length is checked exactly), so
treat any field-list change as a version bump.

## Implementation

| File                                    | Function                                              |
|---|---|
| `src/lib/patchCodec.ts`                 | `encodeLayer`, `decodeLayer`, `encodePart`, `decodePart` |
| `src/components/controls/PatchCode.tsx` | Editable `<textarea>` + Copy button                   |
| `src/components/Layer/Layer.tsx`        | Wires `encodeLayer`/`decodeLayer` to a layer's state   |
| `src/components/Part/Part.tsx`          | Wires `encodePart`/`decodePart` to a part's state      |

The codec is a pure module with no React or DOM dependencies, so it's
trivially unit-testable.
