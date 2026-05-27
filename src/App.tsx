import { useEffect, useState } from 'react';
import { Kit } from './components/Kit/Kit';
import { MidiDevicePicker } from './components/MidiDevicePicker/MidiDevicePicker';
import { Patch } from './components/Patch/Patch';
import { applyPatchChange } from './lib/applyPatchChange';
import { sendPartChange } from './lib/midiSend';
import { loadPartLibrary, type PartPreset } from './lib/partLibrary';
import { useMidi } from './lib/useMidi';
import {
  DEFAULT_KIT,
  type KitState,
  type PartIndex,
  type PatchChange,
} from './types/patch';
import './App.css';

function App() {
  const [kit, setKit] = useState<KitState>(DEFAULT_KIT);
  const [presets, setPresets] = useState<PartPreset[]>([]);
  const midi = useMidi();

  useEffect(() => {
    loadPartLibrary().then(setPresets);
  }, []);

  const onChange = (c: PatchChange) => {
    const nextKit = applyPatchChange(kit, c);
    if (midi.live && midi.output) {
      if ('kind' in c) {
        if (c.kind === 'kit-replace') {
          // Only send CCs for the parts the paste actually replaced;
          // a partial kit (N<6) leaves the device-side parts N+1..6 alone.
          for (let i = 0; i < c.value.parts.length; i++) {
            const partIndex = (i + 1) as PartIndex;
            const part = nextKit.parts[i];
            sendPartChange(
              midi.output,
              partIndex,
              { kind: 'part-replace', value: part },
              part,
            );
          }
        }
        // kind === 'kit' (comment edit) — no MIDI.
      } else {
        const i = c.partIndex - 1;
        sendPartChange(midi.output, c.partIndex, c.change, nextKit.parts[i]);
      }
    }
    setKit(nextKit);
  };

  return (
    <div className="app">
      <header className="app__midi">
        <MidiDevicePicker
          support={midi.support}
          outputs={midi.outputs}
          selectedId={midi.selectedId}
          live={midi.live}
          onConnect={midi.request}
          onSelect={midi.select}
          onLiveChange={midi.setLive}
        />
      </header>
      <Kit value={kit} onChange={onChange} />
      <Patch value={kit.parts} onChange={onChange} presets={presets} />
    </div>
  );
}

export default App;
