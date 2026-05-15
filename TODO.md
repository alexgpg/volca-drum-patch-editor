# TODO

## MIDI

- **Throttle slider-drag CCs.** `doc/midi.md` recommends coalescing
  per-CC at 60–120 Hz. Currently we send one CC per `onChange`, so a
  fast slider drag can produce 100+ messages/sec. Most setups handle
  this fine but cheap USB-MIDI adapters can stutter. Add only if a
  real device shows stutter; remember to always send the *last* value
  on release so the device ends in the right state.

- **"Send patch" action.** When Live toggles on (or a device is
  picked), the device and screen states can diverge until every
  control is touched. A button that walks the current patch and emits
  every CC would bring the device in sync. Synthmata does this
  automatically on connect; we deferred that to keep the model
  explicit.
