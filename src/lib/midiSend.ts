import type { LayerState } from '../types/layer';
import type { PartChange, PartState } from '../types/part';
import type { PartIndex } from '../types/patch';
import {
  PART_CC,
  PITCH_QUANT_CC,
  layerSliderCC,
  selectorsCC,
  selectorsSum,
  type LayerSliderParam,
  type LayerSlot,
  type PartSliderParam,
} from './midiCc';

function sendCC(output: MIDIOutput, partIndex: PartIndex, cc: number, value: number) {
  const status = 0xb0 | ((partIndex - 1) & 0x0f);
  output.send([status, cc & 0x7f, value & 0x7f]);
}

const LAYER_SLIDER_PARAMS: ReadonlySet<string> = new Set<LayerSliderParam>([
  'level',
  'pitch',
  'egAttack',
  'egRelease',
  'modAmount',
  'modRate',
]);

const SELECTOR_PARAMS: ReadonlySet<string> = new Set(['soundSource', 'modType', 'ampEG']);

const PART_SLIDER_PARAMS: ReadonlySet<string> = new Set<PartSliderParam>([
  'pan',
  'send',
  'drive',
  'bitReduction',
  'fold',
  'dryGain',
]);

function sendLayer(output: MIDIOutput, partIndex: PartIndex, slot: LayerSlot, layer: LayerState) {
  sendCC(output, partIndex, selectorsCC(slot), selectorsSum(layer));
  sendCC(output, partIndex, layerSliderCC(slot, 'level'), layer.level);
  sendCC(output, partIndex, layerSliderCC(slot, 'pitch'), layer.pitch);
  sendCC(output, partIndex, layerSliderCC(slot, 'egAttack'), layer.egAttack);
  sendCC(output, partIndex, layerSliderCC(slot, 'egRelease'), layer.egRelease);
  sendCC(output, partIndex, layerSliderCC(slot, 'modAmount'), layer.modAmount);
  sendCC(output, partIndex, layerSliderCC(slot, 'modRate'), layer.modRate);
}

function sendPart(output: MIDIOutput, partIndex: PartIndex, part: PartState) {
  sendCC(output, partIndex, PART_CC.pan, part.pan);
  sendCC(output, partIndex, PART_CC.send, part.send);
  sendCC(output, partIndex, PART_CC.drive, part.drive);
  sendCC(output, partIndex, PART_CC.bitReduction, part.bitReduction);
  sendCC(output, partIndex, PART_CC.fold, part.fold);
  sendCC(output, partIndex, PART_CC.dryGain, part.dryGain);
  sendCC(output, partIndex, PITCH_QUANT_CC, part.pitchQuant ? 127 : 0);
  if (part.linked) {
    sendLayer(output, partIndex, 'both', part.layer1);
    return;
  }
  sendLayer(output, partIndex, 1, part.layer1);
  sendLayer(output, partIndex, 2, part.layer2);
}

export function sendPartChange(
  output: MIDIOutput,
  partIndex: PartIndex,
  change: PartChange,
  nextPart: PartState,
) {
  if (change.kind === 'part-replace') {
    sendPart(output, partIndex, change.value);
    return;
  }

  if (change.kind === 'part') {
    if (change.param === 'linked' && change.value === true) {
      // applyPartChange mirrored layer1 into layer2 in state; bring the
      // device in sync by dumping layer1's values to both layers.
      sendLayer(output, partIndex, 'both', nextPart.layer1);
      return;
    }
    if (change.param === 'pitchQuant' && typeof change.value === 'boolean') {
      sendCC(output, partIndex, PITCH_QUANT_CC, change.value ? 127 : 0);
      return;
    }
    if (PART_SLIDER_PARAMS.has(change.param) && typeof change.value === 'number') {
      sendCC(output, partIndex, PART_CC[change.param as PartSliderParam], change.value);
    }
    return;
  }

  if (change.kind === 'layer') {
    // When linked, applyPartChange has mirrored the change into both
    // layers; the device-side mirror needs the "both" CC, not the
    // per-slot one.
    const slot: LayerSlot = nextPart.linked ? 'both' : change.slot;
    const layer = change.slot === 1 ? nextPart.layer1 : nextPart.layer2;
    if (SELECTOR_PARAMS.has(change.param)) {
      sendCC(output, partIndex, selectorsCC(slot), selectorsSum(layer));
      return;
    }
    if (LAYER_SLIDER_PARAMS.has(change.param) && typeof change.value === 'number') {
      sendCC(
        output,
        partIndex,
        layerSliderCC(slot, change.param as LayerSliderParam),
        change.value,
      );
    }
    return;
  }

  if (change.kind === 'layer-replace') {
    const slot: LayerSlot = nextPart.linked ? 'both' : change.slot;
    sendLayer(output, partIndex, slot, change.value);
  }
}
