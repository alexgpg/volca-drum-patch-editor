import { useCallback, useEffect, useState } from 'react';

export type MidiSupport = 'unsupported' | 'idle' | 'denied' | 'granted';

export interface MidiOutputInfo {
  id: string;
  name: string;
  connected: boolean;
}

export interface UseMidi {
  support: MidiSupport;
  outputs: MidiOutputInfo[];
  selectedId: string | null;
  live: boolean;
  output: MIDIOutput | null;
  request: () => Promise<void>;
  select: (id: string | null) => void;
  setLive: (v: boolean) => void;
}

function listOutputs(access: MIDIAccess): MidiOutputInfo[] {
  const list: MidiOutputInfo[] = [];
  access.outputs.forEach((o) => {
    list.push({
      id: o.id,
      name: o.name ?? o.id,
      connected: o.state === 'connected',
    });
  });
  return list;
}

export function useMidi(): UseMidi {
  const [support, setSupport] = useState<MidiSupport>(() =>
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
      ? 'idle'
      : 'unsupported',
  );
  const [access, setAccess] = useState<MIDIAccess | null>(null);
  const [outputs, setOutputs] = useState<MidiOutputInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!access) return;
    const refresh = () => {
      const list = listOutputs(access);
      setOutputs(list);
      setSelectedId((curr) => {
        if (curr != null) return curr;
        const connected = list.filter((o) => o.connected);
        return connected.length === 1 ? connected[0].id : null;
      });
    };
    refresh();
    access.addEventListener('statechange', refresh);
    return () => {
      access.removeEventListener('statechange', refresh);
    };
  }, [access]);

  const request = useCallback(async () => {
    try {
      const a = await navigator.requestMIDIAccess();
      setSupport('granted');
      setAccess(a);
    } catch {
      setSupport('denied');
    }
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const output: MIDIOutput | null =
    access && selectedId ? access.outputs.get(selectedId) ?? null : null;

  return {
    support,
    outputs,
    selectedId,
    live,
    output,
    request,
    select,
    setLive,
  };
}
