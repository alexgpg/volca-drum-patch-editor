import { useEffect, useState } from 'react';
import { MidiDevicePicker } from './components/MidiDevicePicker/MidiDevicePicker';
import { Patch } from './components/Patch/Patch';
import { applyPartChange } from './lib/applyPartChange';
import { sendPartChange } from './lib/midiSend';
import { loadPartLibrary, type PartPreset } from './lib/partLibrary';
import { useMidi } from './lib/useMidi';
import { DEFAULT_PATCH, type PatchState } from './types/patch';
import './App.css';

function App() {
  const [patch, setPatch] = useState<PatchState>(DEFAULT_PATCH);
  const [presets, setPresets] = useState<PartPreset[]>([]);
  const midi = useMidi();

  useEffect(() => {
    loadPartLibrary().then(setPresets);
  }, []);

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
      <Patch
        value={patch}
        presets={presets}
        onChange={(c) => {
          const i = c.partIndex - 1;
          const nextPart = applyPartChange(patch[i], c.change);
          if (midi.live && midi.output) {
            sendPartChange(midi.output, c.partIndex, c.change, nextPart);
          }
          setPatch((prev) => {
            const next = [...prev] as [
              PatchState[0],
              PatchState[1],
              PatchState[2],
              PatchState[3],
              PatchState[4],
              PatchState[5],
            ];
            next[i] = nextPart;
            return next;
          });
        }}
      />
    </div>
  );
}

export default App;
