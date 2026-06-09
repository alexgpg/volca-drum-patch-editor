import { describe, expect, it } from 'vitest';
import { MidiController } from './midiController';

// A minimal stand-in for MIDIAccess: an EventTarget whose `outputs` map can be
// swapped, firing `statechange` like a real device (dis)connecting.
interface FakePort {
  id: string;
  name: string | null;
  state: 'connected' | 'disconnected';
}

class FakeAccess extends EventTarget {
  outputs: Map<string, FakePort>;
  constructor(ports: FakePort[]) {
    super();
    this.outputs = new Map(ports.map((p) => [p.id, p]));
  }
  change(ports: FakePort[]): void {
    this.outputs = new Map(ports.map((p) => [p.id, p]));
    this.dispatchEvent(new Event('statechange'));
  }
}

function withPorts(ports: FakePort[]) {
  const access = new FakeAccess(ports);
  const controller = new MidiController(
    () => Promise.resolve(access as unknown as MIDIAccess),
  );
  return { access, controller };
}

function countChanges(c: MidiController): () => number {
  let n = 0;
  c.addEventListener('change', () => {
    n += 1;
  });
  return () => n;
}

describe('MidiController', () => {
  it('reports unsupported when there is no access factory', () => {
    const c = new MidiController(null);
    expect(c.support).toBe('unsupported');
  });

  it('starts idle when MIDI is available but not yet requested', () => {
    const { controller } = withPorts([]);
    expect(controller.support).toBe('idle');
    expect(controller.selectedId).toBeNull();
    expect(controller.output).toBeNull();
  });

  it('request() is a no-op when unsupported', async () => {
    const c = new MidiController(null);
    await c.request();
    expect(c.support).toBe('unsupported');
  });

  it('grants and lists outputs on request()', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'Volca', state: 'connected' },
      { id: 'b', name: 'Other', state: 'disconnected' },
    ]);
    await controller.request();
    expect(controller.support).toBe('granted');
    expect(controller.outputs).toEqual([
      { id: 'a', name: 'Volca', connected: true },
      { id: 'b', name: 'Other', connected: false },
    ]);
  });

  it('falls back to the id when an output has no name', async () => {
    const { controller } = withPorts([
      { id: 'port-1', name: null, state: 'connected' },
    ]);
    await controller.request();
    expect(controller.outputs[0].name).toBe('port-1');
  });

  it('auto-selects the sole connected output', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'Volca', state: 'connected' },
      { id: 'b', name: 'Off', state: 'disconnected' },
    ]);
    await controller.request();
    expect(controller.selectedId).toBe('a');
    expect(controller.output).not.toBeNull();
  });

  it('does not auto-select when multiple outputs are connected', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'One', state: 'connected' },
      { id: 'b', name: 'Two', state: 'connected' },
    ]);
    await controller.request();
    expect(controller.selectedId).toBeNull();
  });

  it('does not auto-select when nothing is connected', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'One', state: 'disconnected' },
    ]);
    await controller.request();
    expect(controller.selectedId).toBeNull();
  });

  it('auto-selects when a single device connects after granting', async () => {
    const { access, controller } = withPorts([]);
    await controller.request();
    expect(controller.selectedId).toBeNull();

    access.change([{ id: 'a', name: 'Volca', state: 'connected' }]);
    expect(controller.outputs).toHaveLength(1);
    expect(controller.selectedId).toBe('a');
  });

  it('keeps an explicit selection across statechange refreshes', async () => {
    const { access, controller } = withPorts([
      { id: 'a', name: 'One', state: 'connected' },
      { id: 'b', name: 'Two', state: 'connected' },
    ]);
    await controller.request();
    controller.select('b');

    access.change([
      { id: 'a', name: 'One', state: 'connected' },
      { id: 'b', name: 'Two', state: 'disconnected' },
    ]);
    expect(controller.selectedId).toBe('b');
  });

  it('resolves output from the selected id', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'One', state: 'connected' },
      { id: 'b', name: 'Two', state: 'connected' },
    ]);
    await controller.request();
    expect(controller.output).toBeNull(); // ambiguous → nothing selected

    controller.select('b');
    expect(controller.output).not.toBeNull();

    controller.select(null);
    expect(controller.output).toBeNull();
  });

  it('marks support denied when access is refused', async () => {
    const c = new MidiController(() => Promise.reject(new Error('denied')));
    await c.request();
    expect(c.support).toBe('denied');
  });

  it('emits change on request, select and setLive', async () => {
    const { controller } = withPorts([
      { id: 'a', name: 'One', state: 'connected' },
    ]);
    const changes = countChanges(controller);
    await controller.request(); // refresh → 1
    controller.select('a'); // → 2
    controller.setLive(true); // → 3
    expect(changes()).toBe(3);
    expect(controller.live).toBe(true);
  });

  it('emits change on each statechange refresh', async () => {
    const { access, controller } = withPorts([]);
    await controller.request();
    const changes = countChanges(controller);
    access.change([{ id: 'a', name: 'One', state: 'connected' }]);
    access.change([{ id: 'a', name: 'One', state: 'disconnected' }]);
    expect(changes()).toBe(2);
  });

  it('stops refreshing after dispose()', async () => {
    const { access, controller } = withPorts([]);
    await controller.request();
    controller.dispose();
    const changes = countChanges(controller);

    access.change([{ id: 'a', name: 'One', state: 'connected' }]);
    expect(changes()).toBe(0);
    expect(controller.outputs).toHaveLength(0);
  });
});
