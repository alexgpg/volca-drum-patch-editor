import { describe, expect, it } from 'vitest';
import { labelToPitch, pitchToLabel } from './devicePitchLabels';

// 128 reachable pitch values (every even 0..252 + 255), each with the
// label the device's LCD shows. Lifted verbatim from
// doc/pitch-labels.csv (empirical).
const EMPIRICAL: ReadonlyArray<readonly [number, string]> = [
  [0, 'C-1'], [2, 'C-1'],
  [4, 'C⁰-'], [6, 'D-1'], [8, 'D⁰-'], [10, 'E-1'],
  [12, 'F-1'], [14, 'F⁰-'], [16, 'G-1'], [18, 'G⁰-'],
  [20, 'A-1'], [22, 'A⁰-'], [24, 'B-1'],
  [26, 'C0'], [28, 'C⁰0'], [30, 'D0'], [32, 'D⁰0'], [34, 'E0'],
  [36, 'F0'], [38, 'F⁰0'], [40, 'G0'], [42, 'G⁰0'],
  [44, 'A0'], [46, 'A⁰0'], [48, 'B0'],
  [50, 'C1'], [52, 'C⁰1'], [54, 'D1'], [56, 'D⁰1'], [58, 'E1'],
  [60, 'F1'], [62, 'F⁰1'], [64, 'G1'], [66, 'G⁰1'],
  [68, 'A1'], [70, 'A⁰1'], [72, 'B1'],
  [74, 'C2'], [76, 'C⁰2'], [78, 'D2'], [80, 'D⁰2'], [82, 'E2'],
  [84, 'F2'], [86, 'F⁰2'], [88, 'G2'], [90, 'G⁰2'],
  [92, 'A2'], [94, 'A⁰2'], [96, 'B2'],
  [98, 'C3'], [100, 'C⁰3'], [102, 'D3'], [104, 'D⁰3'], [106, 'E3'],
  [108, 'F3'], [110, 'F⁰3'], [112, 'G3'], [114, 'G⁰3'],
  [116, 'A3'], [118, 'A⁰3'], [120, 'B3'],
  [122, 'C4'], [124, 'C⁰4'], [126, 'D4'], [128, 'D⁰4'], [130, 'E4'],
  [132, 'F4'], [134, 'F⁰4'], [136, 'G4'], [138, 'G⁰4'],
  [140, 'A4'], [142, 'A⁰4'], [144, 'B4'],
  [146, 'C5'], [148, 'C⁰5'], [150, 'D5'], [152, 'D⁰5'], [154, 'E5'],
  [156, 'F5'], [158, 'F⁰5'], [160, 'G5'], [162, 'G⁰5'],
  [164, 'A5'], [166, 'A⁰5'], [168, 'B5'],
  [170, 'C6'], [172, 'C⁰6'], [174, 'D6'], [176, 'D⁰6'], [178, 'E6'],
  [180, 'F6'], [182, 'F⁰6'], [184, 'G6'], [186, 'G⁰6'],
  [188, 'A6'], [190, 'A⁰6'], [192, 'B6'],
  [194, 'C7'], [196, 'C⁰7'], [198, 'D7'], [200, 'D⁰7'], [202, 'E7'],
  [204, 'F7'], [206, 'F⁰7'], [208, 'G7'], [210, 'G⁰7'],
  [212, 'A7'], [214, 'A⁰7'], [216, 'B7'],
  [218, 'C8'], [220, 'C⁰8'], [222, 'D8'], [224, 'D⁰8'], [226, 'E8'],
  [228, 'F8'], [230, 'F⁰8'], [232, 'G8'], [234, 'G⁰8'],
  [236, 'A8'], [238, 'A⁰8'], [240, 'B8'],
  [242, 'C9'], [244, 'C⁰9'], [246, 'D9'], [248, 'D⁰9'], [250, 'E9'],
  [252, 'F9'], [255, 'F⁰9'],
];

describe('pitchToLabel', () => {
  it.each(EMPIRICAL)('pitch %i → "%s"', (pitch, expected) => {
    expect(pitchToLabel(pitch)).toBe(expected);
  });

  it('clips pitch 0 and 1 to C-1', () => {
    expect(pitchToLabel(0)).toBe('C-1');
    expect(pitchToLabel(1)).toBe('C-1');
  });

  it('returns C-1 at the chromatic anchor (pitch 2)', () => {
    expect(pitchToLabel(2)).toBe('C-1');
  });

  it('returns C0 at pitch 26 (zero anchor)', () => {
    expect(pitchToLabel(26)).toBe('C0');
  });

  it('returns F⁰9 at the top endpoint (pitch 255)', () => {
    expect(pitchToLabel(255)).toBe('F⁰9');
  });
});

describe('labelToPitch', () => {
  it.each(EMPIRICAL)('"%s" reverses to a pitch that re-labels to itself', (_pitch, label) => {
    // Some labels round-trip exactly to their own pitch; others map to
    // any pitch in the same chromatic slot. We require only that the
    // label produces a valid pitch whose own label matches.
    const got = labelToPitch(label);
    expect(got).not.toBeNull();
    expect(pitchToLabel(got!)).toBe(label);
  });

  it('accepts the conventional sharp symbol "♯"', () => {
    expect(labelToPitch('C♯0')).toBe(28);
    expect(labelToPitch('A♯-1')).toBe(22);
  });

  it('accepts ASCII "#" as sharp', () => {
    expect(labelToPitch('C#0')).toBe(28);
    expect(labelToPitch('F#3')).toBe(110);
  });

  it('accepts the device truncated form for octave -1 sharps', () => {
    expect(labelToPitch('C⁰-')).toBe(4);
    expect(labelToPitch('A⁰-')).toBe(22);
  });

  it('returns null for unparseable input', () => {
    expect(labelToPitch('')).toBeNull();
    expect(labelToPitch('garbage')).toBeNull();
    expect(labelToPitch('H0')).toBeNull();             // not a real note
    expect(labelToPitch('C-')).toBeNull();             // bare "C-" not a sharp form
    expect(labelToPitch('C⁰?')).toBeNull();
  });

  it('returns null for labels outside the reachable pitch range', () => {
    expect(labelToPitch('C-2')).toBeNull();            // below pitch 2 floor
    expect(labelToPitch('G⁰9')).toBeNull();            // above pitch 255
  });

  it('is case-insensitive for note letters', () => {
    expect(labelToPitch('c0')).toBe(26);
    expect(labelToPitch('a-1')).toBe(20);
    expect(labelToPitch('b3')).toBe(120);
  });
});
