import { decodePart } from './patchCodec';
import type { PartState } from '../types/part';

export interface PartPreset {
  name: string;
  part: PartState;
}

export function parseLibrary(raw: string): PartPreset[] {
  const presets: PartPreset[] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const decoded = decodePart(trimmed);
    if (!decoded) {
      console.warn(`[partLibrary] skipping unparseable line: ${trimmed}`);
      continue;
    }
    // Fall back to a placeholder when the comment is empty or whitespace —
    // a zero-width <option> is unclickable. The part's actual comment field
    // keeps the raw value so applying the preset doesn't write the
    // placeholder into the Part state.
    const name = decoded.comment.trim() === '' ? '(unnamed)' : decoded.comment;
    presets.push({ name, part: decoded });
  }
  return presets;
}

let cached: Promise<PartPreset[]> | null = null;

export function loadPartLibrary(): Promise<PartPreset[]> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}parts.txt`);
      if (!res.ok) {
        console.warn(`[partLibrary] fetch failed: ${res.status} ${res.statusText}`);
        return [];
      }
      return parseLibrary(await res.text());
    } catch (err) {
      console.warn('[partLibrary] fetch error', err);
      return [];
    }
  })();
  return cached;
}
