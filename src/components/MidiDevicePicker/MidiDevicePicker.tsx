import type { ChangeEvent } from 'react';
import type { MidiOutputInfo, MidiSupport } from '../../lib/useMidi';
import { Toggle } from '../controls/Toggle';
import './MidiDevicePicker.css';

export interface MidiDevicePickerProps {
  support: MidiSupport;
  outputs: MidiOutputInfo[];
  selectedId: string | null;
  live: boolean;
  onConnect: () => void;
  onSelect: (id: string | null) => void;
  onLiveChange: (live: boolean) => void;
}

export function MidiDevicePicker({
  support,
  outputs,
  selectedId,
  live,
  onConnect,
  onSelect,
  onLiveChange,
}: MidiDevicePickerProps) {
  if (support === 'unsupported') {
    return (
      <div className="midi-picker midi-picker--message" role="region" aria-label="MIDI device">
        Web MIDI is not supported in this browser.
      </div>
    );
  }

  if (support === 'idle') {
    return (
      <div className="midi-picker" role="region" aria-label="MIDI device">
        <button type="button" className="midi-picker__connect" onClick={onConnect}>
          Connect MIDI
        </button>
      </div>
    );
  }

  if (support === 'denied') {
    return (
      <div className="midi-picker midi-picker--message" role="region" aria-label="MIDI device">
        MIDI access denied — enable it in your browser settings.
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="midi-picker" role="region" aria-label="MIDI device">
        <span className="midi-picker__dot midi-picker__dot--off" aria-hidden="true" />
        <span className="midi-picker__message">No MIDI devices found — plug one in.</span>
      </div>
    );
  }

  const selected = outputs.find((o) => o.id === selectedId) ?? null;
  const connected = selected?.connected ?? false;
  const liveDisabled = !connected;

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onSelect(v === '' ? null : v);
  };

  return (
    <div className="midi-picker" role="region" aria-label="MIDI device">
      <span
        className={`midi-picker__dot midi-picker__dot--${connected ? 'on' : 'off'}`}
        aria-hidden="true"
      />
      <label className="midi-picker__select-label">
        <span className="midi-picker__prefix">{connected ? 'Sending to:' : 'Device:'}</span>
        <select
          className="midi-picker__select"
          value={selectedId ?? ''}
          onChange={onSelectChange}
        >
          {selected === null && <option value="">Select device…</option>}
          {outputs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {!o.connected && ' (disconnected)'}
            </option>
          ))}
        </select>
      </label>
      <div className="midi-picker__live">
        <Toggle
          label="Live"
          value={live && !liveDisabled}
          onChange={onLiveChange}
          disabled={liveDisabled}
        />
      </div>
      {selected !== null && (
        <button
          type="button"
          className="midi-picker__disconnect"
          onClick={() => {
            onLiveChange(false);
            onSelect(null);
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
