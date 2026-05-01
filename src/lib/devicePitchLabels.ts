// Device LCD pitch labels for the Volca Drum.
//
// The device's LCD partitions the 0–255 pitch display range linearly
// into a 12-semitone chromatic grid, anchored at C0 = pitch 26, with
// 2 pitch units per semitone (24 per octave). The labels are
// independent of sound source (sine, saw, or any of the noise
// sources all read the same at the same pitch value).
//
// The grid is purely nominal: it doesn't follow the device's actual
// (exponential) acoustic pitch response. For frequency-accurate note
// targeting see OscillatorSink's research, referenced in
// doc/pitch-and-quantization.md.

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

const C0_PITCH = 26;
const PITCH_PER_SEMITONE = 2;

/**
 * Convert a device pitch value (0–255) to the label the LCD displays.
 *
 * Returns labels in the device's display format with the sharp marker
 * `⁰` and the truncated `<letter>⁰-` form for sharps in octave −1.
 * Pitch values < 2 clip to "C-1" (the device's display floor).
 */
export function pitchToLabel(pitch: number): string {
  if (pitch < 2) return 'C-1';
  const semitonesFromC0 = Math.floor((pitch - C0_PITCH) / PITCH_PER_SEMITONE);
  const octave = Math.floor(semitonesFromC0 / 12);
  const noteIndex = ((semitonesFromC0 % 12) + 12) % 12;
  const note = NOTES[noteIndex];
  return formatLcd(note, octave);
}

function formatLcd(note: string, octave: number): string {
  const sharp = note.endsWith('♯');
  const letter = sharp ? note[0] + '⁰' : note;
  if (octave === -1 && sharp) {
    // <letter>⁰-1 doesn't fit the 3-char LCD note field; the device
    // truncates to <letter>⁰- (visible dash is the leading char of -1).
    return `${letter}-`;
  }
  return `${letter}${octave}`;
}

/**
 * Inverse of pitchToLabel: convert a device-format label (or a more
 * conventional sharp-symbol form like "C♯-1" / "C#-1") to the pitch
 * value it represents on the LCD.
 *
 * Returns null for unparseable input or for labels that fall outside
 * the device's reachable range.
 *
 * Accepts both `⁰` (the device's sharp marker) and `♯` / `#` for
 * convenience.
 */
export function labelToPitch(label: string): number | null {
  const trimmed = label.trim();
  if (trimmed === 'C-1') return 2;

  // Match: <letter>[⁰|♯|#]<octave>
  // Octave is either a single digit (0..9) or "-<digit>" (-1, -2, …)
  // or "-" alone for the truncated octave-(-1) sharp form.
  const m = /^([A-Ga-g])([⁰♯#]?)(-\d|-|\d)$/.exec(trimmed);
  if (!m) return null;
  const [, rawLetter, sharpSym, rawOctave] = m;
  const letterUpper = rawLetter.toUpperCase();
  const sharp = sharpSym !== '';

  let octave: number;
  if (rawOctave === '-') {
    if (!sharp) return null; // bare "<letter>-" only exists for sharps in octave -1
    octave = -1;
  } else if (rawOctave.startsWith('-')) {
    octave = -Number(rawOctave.slice(1));
  } else {
    octave = Number(rawOctave);
  }
  if (!Number.isInteger(octave)) return null;

  const naturalIdx = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(letterUpper);
  if (naturalIdx === -1) return null;

  // Index of the natural in the chromatic NOTES array.
  const chromaticOf: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  const semitonesFromC0 = octave * 12 + chromaticOf[letterUpper] + (sharp ? 1 : 0);
  const pitch = C0_PITCH + semitonesFromC0 * PITCH_PER_SEMITONE;

  if (pitch < 0 || pitch > 255) return null;
  return pitch;
}
