import type { AmpEG, LayerState, ModType, SoundSource } from '../types/layer';
import type { PartState } from '../types/part';

// The single-letter codes below overlap across maps (`l` = lfo or
// noiseLP; `e` = envelope or exp). Disambiguation is positional only:
// the parser reads field 1 as source, field 2 as mod, field 3 as env.
// Reordering these fields silently breaks every existing patch code —
// bump the prefix version (vL1 → vL2) on any reorder or rename.
const SOURCE_CODE: Record<SoundSource, string> = {
  sine: 's', saw: 'w', noiseHP: 'h', noiseLP: 'l', noiseBP: 'b',
};
const SOURCE_FROM: Record<string, SoundSource> = {
  s: 'sine', w: 'saw', h: 'noiseHP', l: 'noiseLP', b: 'noiseBP',
};

const MOD_CODE: Record<ModType, string> = {
  envelope: 'e', lfo: 'l', random: 'r',
};
const MOD_FROM: Record<string, ModType> = {
  e: 'envelope', l: 'lfo', r: 'random',
};

const ENV_CODE: Record<AmpEG, string> = {
  ad: 'a', exp: 'e', multi: 'm',
};
const ENV_FROM: Record<string, AmpEG> = {
  a: 'ad', e: 'exp', m: 'multi',
};

const LAYER_PREFIX = 'vL1:';
const PART_PREFIX = 'vP1:';

function inMidi(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 127;
}

function inBool(n: number): boolean {
  return n === 0 || n === 1;
}

// Comments inside a layer section can't carry the section delimiter (`;`)
// or the part-comment delimiter (`|`). Strip them on encode.
function safeLayerComment(comment: string): string {
  return comment.replace(/[;|]/g, '');
}

// Part comment can't carry its own delimiter (`|`). Strip on encode.
function safePartComment(comment: string): string {
  return comment.replace(/\|/g, '');
}

function layerCore(l: LayerState): string {
  return [
    SOURCE_CODE[l.soundSource],
    MOD_CODE[l.modType],
    ENV_CODE[l.ampEG],
    l.level, l.pitch, l.egAttack, l.egRelease, l.modAmount, l.modRate,
  ].join(',');
}

function layerSection(l: LayerState): string {
  const core = layerCore(l);
  const comment = safeLayerComment(l.comment);
  return comment ? `${core}~${comment}` : core;
}

function parseLayerSection(section: string): LayerState | null {
  const tildeIdx = section.indexOf('~');
  const core = tildeIdx === -1 ? section : section.slice(0, tildeIdx);
  const comment = tildeIdx === -1 ? '' : section.slice(tildeIdx + 1);

  const parts = core.split(',');
  if (parts.length !== 9) return null;
  const [sc, mc, ec, ...rest] = parts;
  if (!(sc in SOURCE_FROM) || !(mc in MOD_FROM) || !(ec in ENV_FROM)) return null;
  const nums = rest.map(Number);
  if (!nums.every(inMidi)) return null;

  return {
    soundSource: SOURCE_FROM[sc],
    modType: MOD_FROM[mc],
    ampEG: ENV_FROM[ec],
    level: nums[0],
    pitch: nums[1],
    egAttack: nums[2],
    egRelease: nums[3],
    modAmount: nums[4],
    modRate: nums[5],
    comment,
  };
}

export function encodeLayer(l: LayerState): string {
  return LAYER_PREFIX + layerSection(l);
}

export function decodeLayer(s: string): LayerState | null {
  const trimmed = s.trim();
  if (!trimmed.startsWith(LAYER_PREFIX)) return null;
  const section = trimmed.slice(LAYER_PREFIX.length);
  // A bare layer string can't contain `;` or `|` — those are part-level
  // separators. Reject ambiguous strings.
  if (section.includes(';') || section.includes('|')) return null;
  return parseLayerSection(section);
}

export function encodePart(p: PartState): string {
  const head = [
    p.pan, p.send, p.pitchQuant ? 1 : 0,
    p.drive, p.bitReduction, p.fold, p.dryGain,
    p.linked ? 1 : 0,
  ].join(',');
  const main = `${head};${layerSection(p.layer1)};${layerSection(p.layer2)}`;
  const comment = safePartComment(p.comment);
  return comment ? `${PART_PREFIX}${main}|${comment}` : `${PART_PREFIX}${main}`;
}

export function decodePart(s: string): PartState | null {
  const trimmed = s.trim();
  if (!trimmed.startsWith(PART_PREFIX)) return null;
  const body = trimmed.slice(PART_PREFIX.length);

  // Part comment is everything after the (single) `|`. Layer comments can't
  // contain `|`, so a second pipe means a malformed string.
  const pipeIdx = body.indexOf('|');
  const main = pipeIdx === -1 ? body : body.slice(0, pipeIdx);
  const partComment = pipeIdx === -1 ? '' : body.slice(pipeIdx + 1);
  if (partComment.includes('|')) return null;

  const sections = main.split(';');
  if (sections.length !== 3) return null;
  const [head, l1Section, l2Section] = sections;

  const headParts = head.split(',');
  if (headParts.length !== 8) return null;
  const nums = headParts.map(Number);
  if (!nums.every(Number.isInteger)) return null;
  const [pan, send, pq, drive, bitRed, fold, dryGain, linked] = nums;
  if (![pan, send, drive, bitRed, fold, dryGain].every(inMidi)) return null;
  if (!inBool(pq) || !inBool(linked)) return null;

  const layer1 = parseLayerSection(l1Section);
  const layer2 = parseLayerSection(l2Section);
  if (!layer1 || !layer2) return null;

  return {
    layer1,
    layer2,
    pan,
    send,
    pitchQuant: pq === 1,
    drive,
    bitReduction: bitRed,
    fold,
    dryGain,
    linked: linked === 1,
    comment: partComment,
  };
}
