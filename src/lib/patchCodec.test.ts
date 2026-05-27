import { describe, expect, it } from 'vitest';
import {
  decodeKit,
  decodeLayer,
  decodePart,
  encodeKit,
  encodeLayer,
  encodePart,
  parseLibrary,
} from './patchCodec';
import { DEFAULT_LAYER, type LayerState } from '../types/layer';
import { DEFAULT_PART, type PartState } from '../types/part';
import {
  DEFAULT_KIT,
  type KitState,
  type PartialKit,
  type PatchState,
} from '../types/patch';

describe('Layer round-trip', () => {
  it('default Layer encodes to the expected LCD string and decodes back', () => {
    // DEFAULT_LAYER CC fields map to LCD as:
    //   level=100 → 200, pitch=64 → 128, egAttack=0 → 0,
    //   egRelease=64 → 128, modAmount=0 → -100, modRate=64 → 128
    const encoded = encodeLayer(DEFAULT_LAYER);
    expect(encoded).toBe('vL1:s,e,a,200,128,0,128,-100,128');
    expect(decodeLayer(encoded)).toEqual(DEFAULT_LAYER);
  });

  it('round-trips every Sound Source / Mod Type / Amp EG combination', () => {
    const sources: LayerState['soundSource'][] = [
      'sine', 'saw', 'noiseHP', 'noiseLP', 'noiseBP',
    ];
    const mods: LayerState['modType'][] = ['envelope', 'lfo', 'random'];
    const envs: LayerState['ampEG'][] = ['ad', 'exp', 'multi'];
    for (const soundSource of sources) {
      for (const modType of mods) {
        for (const ampEG of envs) {
          const layer: LayerState = { ...DEFAULT_LAYER, soundSource, modType, ampEG };
          expect(decodeLayer(encodeLayer(layer))).toEqual(layer);
        }
      }
    }
  });

  it('round-trips boundary numbers (0 and 127)', () => {
    const allZero: LayerState = {
      ...DEFAULT_LAYER,
      level: 0, pitch: 0, egAttack: 0, egRelease: 0, modAmount: 0, modRate: 0,
    };
    const allMax: LayerState = {
      ...DEFAULT_LAYER,
      level: 127, pitch: 127, egAttack: 127, egRelease: 127,
      modAmount: 127, modRate: 127,
    };
    expect(decodeLayer(encodeLayer(allZero))).toEqual(allZero);
    expect(decodeLayer(encodeLayer(allMax))).toEqual(allMax);
  });

  it('round-trips with a comment', () => {
    const layer: LayerState = { ...DEFAULT_LAYER, comment: 'kick body' };
    expect(decodeLayer(encodeLayer(layer))).toEqual(layer);
  });

  it('preserves "," and "~" inside a layer comment', () => {
    const layer: LayerState = { ...DEFAULT_LAYER, comment: 'foo, bar~baz' };
    expect(decodeLayer(encodeLayer(layer))).toEqual(layer);
  });

  it('strips ";" and "|" from a layer comment on encode', () => {
    const layer: LayerState = { ...DEFAULT_LAYER, comment: 'a;b|c' };
    const decoded = decodeLayer(encodeLayer(layer));
    expect(decoded?.comment).toBe('abc');
  });

  it('treats a trailing "~" as an empty comment', () => {
    expect(decodeLayer('vL1:s,e,a,200,128,0,128,-100,128~')).toEqual({
      ...DEFAULT_LAYER,
      comment: '',
    });
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(decodeLayer('  vL1:s,e,a,200,128,0,128,-100,128  ')).toEqual(DEFAULT_LAYER);
  });

  it('round-trips a non-trivial bipolar Mod Amount', () => {
    // modAmount CC=96 ↔ LCD=+50.
    const layer: LayerState = { ...DEFAULT_LAYER, modAmount: 96 };
    expect(encodeLayer(layer)).toContain(',50,'); // appears as the modAmount field
    expect(decodeLayer(encodeLayer(layer))).toEqual(layer);
  });
});

describe('Layer rejection', () => {
  it.each([
    '',
    'garbage',
    'vL1:',                                       // empty body
    'vL1:s,e,a,200,128,0,128,-100',               // 8 fields not 9
    'vL1:s,e,a,200,128,0,128,-100,128,extra',    // 10 fields
    'vL1:x,e,a,200,128,0,128,-100,128',           // unknown sound source
    'vL1:s,x,a,200,128,0,128,-100,128',           // unknown mod type
    'vL1:s,e,x,200,128,0,128,-100,128',           // unknown amp EG
    'vL1:s,e,a,256,128,0,128,-100,128',           // level over 255
    'vL1:s,e,a,-1,128,0,128,-100,128',            // level negative
    'vL1:s,e,a,200,256,0,128,-100,128',           // pitch over 255
    'vL1:s,e,a,200,128,0,128,101,128',            // modAmount over +100
    'vL1:s,e,a,200,128,0,128,-101,128',           // modAmount below -100
    'vL1:s,e,a,200,128,0,128,-100,256',           // modRate over 255
    'vL1:s,e,a,3.5,128,0,128,-100,128',           // non-integer
    'vL1:s,e,a,nope,128,0,128,-100,128',          // not a number
    'vL1:s,e,a,200,128,0,128,-100,128;extra',     // `;` not allowed in standalone Layer
    'vL1:s,e,a,200,128,0,128,-100,128|extra',     // `|` not allowed in standalone Layer
    'vP1:s,e,a,200,128,0,128,-100,128',           // wrong prefix
  ])('rejects %s', (s) => {
    expect(decodeLayer(s)).toBeNull();
  });

  it('rejects a Part code', () => {
    expect(decodeLayer(encodePart(DEFAULT_PART))).toBeNull();
  });
});

describe('Part round-trip', () => {
  it('default Part encodes to the expected LCD string and decodes back', () => {
    // DEFAULT_PART CC head maps to LCD: pan=64→0, send=0→0, pq=0,
    //   drive=0→0, bitReduction=0→0, fold=0→0, dryGain=64→0, linked=0.
    const encoded = encodePart(DEFAULT_PART);
    expect(encoded).toBe(
      'vP1:0,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',
    );
    expect(decodePart(encoded)).toEqual(DEFAULT_PART);
  });

  it('round-trips with comments on both layers and the part', () => {
    const part: PartState = {
      ...DEFAULT_PART,
      comment: 'punchy snare',
      layer1: { ...DEFAULT_PART.layer1, comment: 'snare body' },
      layer2: { ...DEFAULT_PART.layer2, comment: 'rattle' },
    };
    expect(decodePart(encodePart(part))).toEqual(part);
  });

  it('round-trips boolean fields (pitchQuant, linked)', () => {
    const part: PartState = { ...DEFAULT_PART, pitchQuant: true, linked: true };
    const decoded = decodePart(encodePart(part));
    expect(decoded?.pitchQuant).toBe(true);
    expect(decoded?.linked).toBe(true);
  });

  it('strips "|" from a part comment on encode', () => {
    const part: PartState = { ...DEFAULT_PART, comment: 'a|b|c' };
    const decoded = decodePart(encodePart(part));
    expect(decoded?.comment).toBe('abc');
  });

  it('preserves ";" and "~" inside a part comment', () => {
    const part: PartState = { ...DEFAULT_PART, comment: 'foo; bar~baz' };
    expect(decodePart(encodePart(part))).toEqual(part);
  });
});

describe('Part rejection', () => {
  it.each([
    '',
    'garbage',
    'vP1:',
    'vP1:0,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128',                                  // missing layer 2
    'vP1:0,0,0,0,0,0,0',                                                                  // 7 head fields not 8
    'vP1:0,0,0,0,0,0,0,0,extra;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128', // 9 head fields
    'vP1:0,0,2,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',       // pitchQuant=2 not 0/1
    'vP1:0,0,0,0,0,0,0,2;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',       // linked=2 not 0/1
    'vP1:128,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',     // pan over +100
    'vP1:-101,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',    // pan below -100
    'vP1:0,256,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',     // send over 255
    'vP1:0,0,0,0,0,0,101,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128',     // dryGain over +100
    'vP1:0,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,256,128,0,128,-100,128',       // layer 2 level over 255
    'vL1:s,e,a,200,128,0,128,-100,128',                                                    // wrong prefix
  ])('rejects %s', (s) => {
    expect(decodePart(s)).toBeNull();
  });

  it('rejects a Layer code', () => {
    expect(decodePart(encodeLayer(DEFAULT_LAYER))).toBeNull();
  });
});

const DEFAULT_PART_CODE = encodePart(DEFAULT_PART);

function makeKit(comment: string, parts?: readonly PartState[]): KitState {
  const six = (parts ?? [
    DEFAULT_PART, DEFAULT_PART, DEFAULT_PART,
    DEFAULT_PART, DEFAULT_PART, DEFAULT_PART,
  ]) as unknown as PatchState;
  return { parts: six, comment };
}

describe('Kit round-trip', () => {
  it('default Kit encodes to a `#` header followed by six default Part codes', () => {
    const encoded = encodeKit(DEFAULT_KIT);
    const expected = ['#', ...Array(6).fill(DEFAULT_PART_CODE)].join('\n');
    expect(encoded).toBe(expected);
    expect(decodeKit(encoded)).toEqual(DEFAULT_KIT);
  });

  it('round-trips a comment in the header', () => {
    const kit = makeKit('Funky Drums');
    const encoded = encodeKit(kit);
    expect(encoded.startsWith('# Funky Drums\n')).toBe(true);
    expect(decodeKit(encoded)).toEqual(kit);
  });

  it('round-trips per-part comments through the kit envelope', () => {
    const named = ['kick', 'snare', 'hat', 'tom', 'rim', 'cym'].map((c) => ({
      ...DEFAULT_PART,
      comment: c,
    }));
    const kit = makeKit('Drum kit', named);
    expect(decodeKit(encodeKit(kit))).toEqual(kit);
  });

  it('preserves "#" inside the comment body', () => {
    const kit = makeKit('Beat #4');
    expect(decodeKit(encodeKit(kit))?.comment).toBe('Beat #4');
  });

  it('strips a leading "#" from the kit comment on encode', () => {
    // Without this, encoding "# foo" would emit "# # foo", which the
    // parser would read back as comment "# foo" — silently double-prefixed.
    const kit = makeKit('# raw');
    expect(decodeKit(encodeKit(kit))?.comment).toBe('raw');
  });

  it('strips newlines from the kit comment on encode', () => {
    const kit = makeKit('line one\nline two');
    expect(decodeKit(encodeKit(kit))?.comment).toBe('line oneline two');
  });

  it('tolerates surrounding whitespace and blank lines around the kit', () => {
    const encoded = `\n\n  ${encodeKit(DEFAULT_KIT)}  \n\n`;
    expect(decodeKit(encoded)).toEqual(DEFAULT_KIT);
  });
});

describe('Kit partial decode', () => {
  it('accepts a 1-part kit (replaces just part 1)', () => {
    const encoded = `# single\n${DEFAULT_PART_CODE}`;
    const expected: PartialKit = { comment: 'single', parts: [DEFAULT_PART] };
    expect(decodeKit(encoded)).toEqual(expected);
  });

  it('accepts a 3-part kit (replaces parts 1..3)', () => {
    const encoded = `# trio\n${DEFAULT_PART_CODE}\n${DEFAULT_PART_CODE}\n${DEFAULT_PART_CODE}`;
    const expected: PartialKit = {
      comment: 'trio',
      parts: [DEFAULT_PART, DEFAULT_PART, DEFAULT_PART],
    };
    expect(decodeKit(encoded)).toEqual(expected);
  });

  it('accepts a 5-part kit', () => {
    const encoded = ['# five', ...Array(5).fill(DEFAULT_PART_CODE)].join('\n');
    const decoded = decodeKit(encoded);
    expect(decoded?.parts.length).toBe(5);
  });

  it('accepts a headerless paste of vP1: lines as an empty-comment kit', () => {
    const body = `${DEFAULT_PART_CODE}\n${DEFAULT_PART_CODE}\n${DEFAULT_PART_CODE}`;
    const expected: PartialKit = {
      comment: '',
      parts: [DEFAULT_PART, DEFAULT_PART, DEFAULT_PART],
    };
    expect(decodeKit(body)).toEqual(expected);
  });

  it('accepts a headerless paste of 6 vP1: lines', () => {
    const body = Array(6).fill(DEFAULT_PART_CODE).join('\n');
    const decoded = decodeKit(body);
    expect(decoded?.parts.length).toBe(6);
    expect(decoded?.comment).toBe('');
  });
});

describe('Kit rejection', () => {
  it('rejects a kit with no parts (`#` header alone)', () => {
    expect(decodeKit('# empty')).toBeNull();
  });

  it('rejects a kit with 7 parts', () => {
    const encoded = ['# long', ...Array(7).fill(DEFAULT_PART_CODE)].join('\n');
    expect(decodeKit(encoded)).toBeNull();
  });

  it('rejects a kit containing an invalid Part code', () => {
    const encoded = [
      '# bad',
      DEFAULT_PART_CODE,
      DEFAULT_PART_CODE,
      'vP1:garbage',
      DEFAULT_PART_CODE,
      DEFAULT_PART_CODE,
      DEFAULT_PART_CODE,
    ].join('\n');
    expect(decodeKit(encoded)).toBeNull();
  });

  it('rejects multi-kit input (decodeKit expects exactly one)', () => {
    const two = `${encodeKit(makeKit('A'))}\n${encodeKit(makeKit('B'))}`;
    expect(decodeKit(two)).toBeNull();
  });

  it('rejects input with an unknown line shape', () => {
    const encoded = `# bad\n${DEFAULT_PART_CODE}\ngarbage\n${DEFAULT_PART_CODE}`;
    expect(decodeKit(encoded)).toBeNull();
  });

  it('rejects empty input', () => {
    expect(decodeKit('')).toBeNull();
    expect(decodeKit('   \n\n  ')).toBeNull();
  });
});

describe('Library parse', () => {
  it('parses two kits back', () => {
    const a = makeKit('Kit A');
    const b = makeKit('Kit B');
    const text = `${encodeKit(a)}\n${encodeKit(b)}`;
    expect(parseLibrary(text)).toEqual([a, b]);
  });

  it('keeps a 2-part partial kit in a library', () => {
    const good = makeKit('Good');
    const text = [
      '# Short',
      DEFAULT_PART_CODE,
      DEFAULT_PART_CODE,
      encodeKit(good),
    ].join('\n');
    expect(parseLibrary(text)).toEqual([
      { comment: 'Short', parts: [DEFAULT_PART, DEFAULT_PART] },
      good,
    ]);
  });

  it('drops a library kit with too many parts but keeps the rest', () => {
    const good = makeKit('Good');
    const text = [
      '# Overflowing',
      ...Array(7).fill(DEFAULT_PART_CODE),
      encodeKit(good),
    ].join('\n');
    expect(parseLibrary(text)).toEqual([good]);
  });

  it('tolerates blank lines between kits', () => {
    const a = makeKit('A');
    const b = makeKit('B');
    const text = `${encodeKit(a)}\n\n\n${encodeKit(b)}\n`;
    expect(parseLibrary(text)).toEqual([a, b]);
  });

  it('returns [] when a leading vP1: appears before any `#`', () => {
    const text = `${DEFAULT_PART_CODE}\n${encodeKit(makeKit('After'))}`;
    expect(parseLibrary(text)).toEqual([]);
  });

  it('returns [] for empty input', () => {
    expect(parseLibrary('')).toEqual([]);
    expect(parseLibrary('\n\n\n')).toEqual([]);
  });
});
