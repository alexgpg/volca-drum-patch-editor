import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseLibrary } from './partLibrary';

describe('parseLibrary', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns [] for empty input', () => {
    expect(parseLibrary('')).toEqual([]);
  });

  it('skips comment and blank lines', () => {
    const raw = `
# header comment
   # indented comment

#another
`;
    expect(parseLibrary(raw)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('parses one valid entry surrounded by comments and blanks', () => {
    const raw = `
# preset library

vP1:0,0,0,0,0,0,0,0;s,e,e,152,36,0,120,50,160;h,r,m,255,156,86,90,41,255|Snare A1 Short Book

# end
`;
    const presets = parseLibrary(raw);
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Snare A1 Short Book');
    expect(presets[0].part.comment).toBe('Snare A1 Short Book');
    expect(presets[0].part.layer2.soundSource).toBe('noiseHP');
  });

  it('skips a malformed line but keeps a valid neighbour', () => {
    const raw = [
      'vP1:garbage',
      'vP1:0,0,1,24,0,78,0,0;s,e,e,255,20,0,148,39,144;s,e,e,48,68,0,96,60,130|Kick',
    ].join('\n');
    const presets = parseLibrary(raw);
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Kick');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('labels an entry with an empty comment as (unnamed) but keeps the raw comment on the part', () => {
    const raw = 'vP1:64,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128';
    const presets = parseLibrary(raw);
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('(unnamed)');
    expect(presets[0].part.comment).toBe('');
    expect(warn).not.toHaveBeenCalled();
  });

  it('labels a whitespace-only comment as (unnamed)', () => {
    // Trailing line whitespace is stripped by the per-line trim, so the
    // comment ends up empty. The fallback still kicks in.
    const raw = 'vP1:64,0,0,0,0,0,0,0;s,e,a,200,128,0,128,-100,128;s,e,a,200,128,0,128,-100,128|   ';
    const presets = parseLibrary(raw);
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('(unnamed)');
  });

  it('parses all three seed lines from public/parts.txt', () => {
    const raw = [
      'vP1:0,0,1,24,0,78,0,0;s,e,e,255,20,0,148,39,144;s,e,e,48,68,0,96,60,130|Kick: A1-Book',
      'vP1:0,0,0,0,0,0,0,0;s,e,e,152,36,0,120,50,160;h,r,m,255,156,86,90,41,255|Snare A1 Short Book',
      'vP1:0,0,0,255,255,255,0,0;w,r,e,100,255,0,74,63,255;h,l,m,100,255,42,0,57,255|HH closed razor',
    ].join('\n');
    const presets = parseLibrary(raw);
    expect(presets.map((p) => p.name)).toEqual([
      'Kick: A1-Book',
      'Snare A1 Short Book',
      'HH closed razor',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('allows duplicate names', () => {
    const line = 'vP1:0,0,0,0,0,0,0,0;s,e,e,152,36,0,120,50,160;h,r,m,255,156,86,90,41,255|Snare';
    const raw = [line, line].join('\n');
    const presets = parseLibrary(raw);
    expect(presets).toHaveLength(2);
    expect(presets[0].name).toBe('Snare');
    expect(presets[1].name).toBe('Snare');
  });
});
