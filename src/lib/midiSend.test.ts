import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYER, type LayerState } from '../types/layer';
import { DEFAULT_PART } from '../types/part';
import { sendPartChange } from './midiSend';

interface SentMessage {
  status: number;
  cc: number;
  value: number;
}

function captureOutput(): { sent: SentMessage[]; output: MIDIOutput } {
  const sent: SentMessage[] = [];
  const output = {
    send: (bytes: number[]) => {
      sent.push({ status: bytes[0], cc: bytes[1], value: bytes[2] });
    },
  } as unknown as MIDIOutput;
  return { sent, output };
}

describe('sendPartChange — part-level changes', () => {
  it('sends a part slider on the part channel', () => {
    const { sent, output } = captureOutput();
    sendPartChange(
      output,
      3,
      { kind: 'part', param: 'pan', value: 100 },
      { ...DEFAULT_PART, pan: 100 },
    );
    expect(sent).toEqual([{ status: 0xb2, cc: 10, value: 100 }]);
  });

  it('sends pitch quantization as 127/0', () => {
    const a = captureOutput();
    sendPartChange(
      a.output,
      1,
      { kind: 'part', param: 'pitchQuant', value: true },
      { ...DEFAULT_PART, pitchQuant: true },
    );
    expect(a.sent).toEqual([{ status: 0xb0, cc: 53, value: 127 }]);

    const b = captureOutput();
    sendPartChange(
      b.output,
      1,
      { kind: 'part', param: 'pitchQuant', value: false },
      { ...DEFAULT_PART, pitchQuant: false },
    );
    expect(b.sent).toEqual([{ status: 0xb0, cc: 53, value: 0 }]);
  });

  it('ignores the comment field', () => {
    const { sent, output } = captureOutput();
    sendPartChange(output, 1, { kind: 'part', param: 'comment', value: 'kick' }, DEFAULT_PART);
    expect(sent).toEqual([]);
  });

  it('emits the part channel for partIndex 1..6', () => {
    const { sent, output } = captureOutput();
    for (let p = 1 as 1 | 2 | 3 | 4 | 5 | 6; p <= 6; p++) {
      sendPartChange(
        output,
        p as 1 | 2 | 3 | 4 | 5 | 6,
        { kind: 'part', param: 'pan', value: 64 },
        DEFAULT_PART,
      );
    }
    expect(sent.map((m) => m.status)).toEqual([0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5]);
  });
});

describe('sendPartChange — layer changes', () => {
  it('sends a layer slider on the part channel using the per-slot CC', () => {
    const a = captureOutput();
    sendPartChange(
      a.output,
      1,
      { kind: 'layer', slot: 1, param: 'level', value: 100 },
      { ...DEFAULT_PART, layer1: { ...DEFAULT_LAYER, level: 100 } },
    );
    expect(a.sent).toEqual([{ status: 0xb0, cc: 17, value: 100 }]);

    const b = captureOutput();
    sendPartChange(
      b.output,
      2,
      { kind: 'layer', slot: 2, param: 'pitch', value: 50 },
      { ...DEFAULT_PART, layer2: { ...DEFAULT_LAYER, pitch: 50 } },
    );
    expect(b.sent).toEqual([{ status: 0xb1, cc: 27, value: 50 }]);
  });

  it('encodes selector changes as the sum on the layer selectors CC', () => {
    const { sent, output } = captureOutput();
    const nextLayer1: LayerState = { ...DEFAULT_LAYER, soundSource: 'saw' };
    sendPartChange(
      output,
      1,
      { kind: 'layer', slot: 1, param: 'soundSource', value: 'saw' },
      { ...DEFAULT_PART, layer1: nextLayer1 },
    );
    expect(sent).toEqual([{ status: 0xb0, cc: 14, value: 26 }]);
  });

  it('uses the post-change layer state so concurrent selector edits combine', () => {
    const { sent, output } = captureOutput();
    const nextLayer2: LayerState = {
      ...DEFAULT_LAYER,
      soundSource: 'noiseLP',
      modType: 'lfo',
      ampEG: 'exp',
    };
    sendPartChange(
      output,
      4,
      { kind: 'layer', slot: 2, param: 'ampEG', value: 'exp' },
      { ...DEFAULT_PART, layer2: nextLayer2 },
    );
    expect(sent).toEqual([{ status: 0xb3, cc: 15, value: 77 + 9 + 3 }]);
  });

  it('ignores the layer comment field', () => {
    const { sent, output } = captureOutput();
    sendPartChange(
      output,
      1,
      { kind: 'layer', slot: 1, param: 'comment', value: 'snare' },
      DEFAULT_PART,
    );
    expect(sent).toEqual([]);
  });
});

describe('sendPartChange — linked layers', () => {
  it('uses the "both" slider CC when a layer change happens while linked', () => {
    const { sent, output } = captureOutput();
    const nextPart = {
      ...DEFAULT_PART,
      linked: true,
      layer1: { ...DEFAULT_LAYER, level: 80 },
      layer2: { ...DEFAULT_LAYER, level: 80 },
    };
    sendPartChange(
      output,
      1,
      { kind: 'layer', slot: 1, param: 'level', value: 80 },
      nextPart,
    );
    expect(sent).toEqual([{ status: 0xb0, cc: 19, value: 80 }]);
  });

  it('uses the "both" selectors CC for a selector change while linked', () => {
    const { sent, output } = captureOutput();
    const mirroredLayer: LayerState = { ...DEFAULT_LAYER, soundSource: 'saw' };
    sendPartChange(
      output,
      1,
      { kind: 'layer', slot: 1, param: 'soundSource', value: 'saw' },
      { ...DEFAULT_PART, linked: true, layer1: mirroredLayer, layer2: mirroredLayer },
    );
    expect(sent).toEqual([{ status: 0xb0, cc: 16, value: 26 }]);
  });

  it('dumps layer1 to both layers when linked is toggled on', () => {
    const { sent, output } = captureOutput();
    const seeded: LayerState = {
      ...DEFAULT_LAYER,
      soundSource: 'noiseLP',
      modType: 'lfo',
      ampEG: 'multi',
      level: 90,
      pitch: 40,
      egAttack: 12,
      egRelease: 70,
      modAmount: 50,
      modRate: 30,
    };
    sendPartChange(
      output,
      1,
      { kind: 'part', param: 'linked', value: true },
      { ...DEFAULT_PART, linked: true, layer1: seeded, layer2: seeded },
    );
    expect(sent).toEqual([
      { status: 0xb0, cc: 16, value: 77 + 9 + 6 },
      { status: 0xb0, cc: 19, value: 90 },
      { status: 0xb0, cc: 28, value: 40 },
      { status: 0xb0, cc: 22, value: 12 },
      { status: 0xb0, cc: 25, value: 70 },
      { status: 0xb0, cc: 31, value: 50 },
      { status: 0xb0, cc: 48, value: 30 },
    ]);
  });

  it('sends nothing when linked is toggled off', () => {
    const { sent, output } = captureOutput();
    sendPartChange(
      output,
      1,
      { kind: 'part', param: 'linked', value: false },
      { ...DEFAULT_PART, linked: false },
    );
    expect(sent).toEqual([]);
  });
});

describe('sendPartChange — layer-replace', () => {
  it('sends one selectors CC plus six slider CCs in order', () => {
    const { sent, output } = captureOutput();
    const layer: LayerState = {
      soundSource: 'saw',
      modType: 'lfo',
      ampEG: 'multi',
      level: 100,
      pitch: 50,
      egAttack: 10,
      egRelease: 80,
      modAmount: 64,
      modRate: 20,
      comment: '',
    };
    sendPartChange(
      output,
      2,
      { kind: 'layer-replace', slot: 1, value: layer },
      { ...DEFAULT_PART, layer1: layer },
    );
    expect(sent).toEqual([
      { status: 0xb1, cc: 14, value: 26 + 9 + 6 },
      { status: 0xb1, cc: 17, value: 100 },
      { status: 0xb1, cc: 26, value: 50 },
      { status: 0xb1, cc: 20, value: 10 },
      { status: 0xb1, cc: 23, value: 80 },
      { status: 0xb1, cc: 29, value: 64 },
      { status: 0xb1, cc: 46, value: 20 },
    ]);
  });

  it('uses the "both" slot CCs when linked', () => {
    const { sent, output } = captureOutput();
    const layer: LayerState = {
      soundSource: 'saw',
      modType: 'lfo',
      ampEG: 'multi',
      level: 100,
      pitch: 50,
      egAttack: 10,
      egRelease: 80,
      modAmount: 64,
      modRate: 20,
      comment: '',
    };
    sendPartChange(
      output,
      2,
      { kind: 'layer-replace', slot: 1, value: layer },
      { ...DEFAULT_PART, linked: true, layer1: layer, layer2: layer },
    );
    expect(sent).toEqual([
      { status: 0xb1, cc: 16, value: 26 + 9 + 6 },
      { status: 0xb1, cc: 19, value: 100 },
      { status: 0xb1, cc: 28, value: 50 },
      { status: 0xb1, cc: 22, value: 10 },
      { status: 0xb1, cc: 25, value: 80 },
      { status: 0xb1, cc: 31, value: 64 },
      { status: 0xb1, cc: 48, value: 20 },
    ]);
  });
});
