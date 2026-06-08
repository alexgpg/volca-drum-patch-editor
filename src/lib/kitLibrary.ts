import { parseLibrary } from './patchCodec';
import type { PartialKit } from '../types/patch';

let cached: Promise<PartialKit[]> | null = null;

export function loadKitLibrary(): Promise<PartialKit[]> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}kits.txt`);
      if (!res.ok) {
        console.warn(`[kitLibrary] fetch failed: ${res.status} ${res.statusText}`);
        return [];
      }
      return parseLibrary(await res.text());
    } catch (err) {
      console.warn('[kitLibrary] fetch error', err);
      return [];
    }
  })();
  return cached;
}
