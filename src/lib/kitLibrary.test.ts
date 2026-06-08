import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mirrors the seed content of public/kits.txt — keep in sync. The
// happy-path test doubles as a guard that the bundled file stays valid.
const SEED = `# Volca Drum kit presets
#
# Format reference: doc/patch-format.md

# Sample Kit 1
vP1:0,0,1,24,0,78,0,0;s,e,e,255,20,0,148,39,144;s,e,e,48,68,0,96,60,130|Kick: A1-Book
vP1:0,0,0,0,0,0,0,0;s,e,e,152,36,0,120,50,160;h,r,m,255,156,86,90,41,255|Snare A1 Short Book
vP1:0,0,0,255,255,255,0,0;w,r,e,100,255,0,74,63,255;h,l,m,100,255,42,0,57,255|HH closed razor
`;

describe('loadKitLibrary', () => {
  beforeEach(() => {
    // Fresh module per test so the internal load cache starts empty.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches and parses the kit library', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => SEED })));
    const { loadKitLibrary } = await import('./kitLibrary');
    const kits = await loadKitLibrary();
    expect(kits).toHaveLength(1);
    expect(kits[0].comment).toBe('Sample Kit 1');
    expect(kits[0].parts.map((p) => p.comment)).toEqual([
      'Kick: A1-Book',
      'Snare A1 Short Book',
      'HH closed razor',
    ]);
  });

  it('returns [] and warns on a non-ok response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found' })));
    const { loadKitLibrary } = await import('./kitLibrary');
    expect(await loadKitLibrary()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('returns [] and warns on a network error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));
    const { loadKitLibrary } = await import('./kitLibrary');
    expect(await loadKitLibrary()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('fetches once and caches across calls', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, text: async () => SEED }));
    vi.stubGlobal('fetch', fetchSpy);
    const { loadKitLibrary } = await import('./kitLibrary');
    await loadKitLibrary();
    await loadKitLibrary();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
