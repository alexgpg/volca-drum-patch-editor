import { useState } from 'react';
import { Patch } from './components/Patch/Patch';
import { applyPartChange } from './lib/applyPartChange';
import { DEFAULT_PATCH, type PatchState } from './types/patch';
import './App.css';

function App() {
  const [patch, setPatch] = useState<PatchState>(DEFAULT_PATCH);

  return (
    <Patch
      value={patch}
      onChange={(c) => {
        setPatch((prev) => {
          const i = c.partIndex - 1;
          const next = [...prev] as [
            PatchState[0],
            PatchState[1],
            PatchState[2],
            PatchState[3],
            PatchState[4],
            PatchState[5],
          ];
          next[i] = applyPartChange(prev[i], c.change);
          return next;
        });
      }}
      onPartReplace={(partIndex, nextPart) => {
        setPatch((prev) => {
          const i = partIndex - 1;
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
  );
}

export default App;
