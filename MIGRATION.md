# React → Web Components migration

Tracking the experimental rewrite of the editor UI from React to native
Web Components (custom elements). Lives on the `experiment/web-components`
branch; `main` stays React until this proves itself.

## Why it's tractable here

- **`src/lib/` is already framework-free.** `patchCodec`, `midiSend`,
  `applyPatchChange`, `midiCc`, `deviceScale`, `devicePitch`, `partLibrary`,
  `kitLibrary` import nothing from React. They port with zero changes, and
  their `.test.ts` files come along untouched.
- **The app is already unidirectional.** `App` holds the single `kit` source
  of truth, passing `value` down and `onChange` up — exactly the prop-down /
  event-up model custom elements are built around.
- **It's small** — ~16 components, all controlled, no large stateful trees.

## Plan (bottom-up, incremental)

1. **Branch, don't migrate in place.** Keep `src/lib/` shared and untouched. ✅
2. **Port leaf controls first:** `Toggle` → `Slider` → `ScaledSlider` →
   `IconRadioGroup` → `PatchCode` → `PitchPicker`. No children, so they prove
   out the conventions cheaply. ✅ *All six leaves ported: Toggle, Slider,
   ScaledSlider, IconRadioGroup, PatchCode, PitchPicker.*
3. **Lock conventions early** (see below) — inconsistency here is what bites
   mid-migration.
4. **Port `useMidi` → a controller/store.** The one stateful piece with real
   lifecycle: the `statechange` refresh and auto-select-single-output logic.
   Verify against a real device. ✅ *store (15 unit tests) + picker done.*
5. **Compose upward:** `Layer` → `Part` → `Kit`/`Patch` → `App`.
   ✅ *complete — `<volca-app>` is the root; index.html boots React-free*
6. **Move `.test.ts` as you go.** Logic tests pass unchanged; only component
   tests need rewriting.
7. **Migrate Storybook stories last**, per component, then swap Storybook to
   `@storybook/web-components-vite` once React is gone (see note below).

**Escape hatch:** React 19 can host finished custom elements, so components
can move one at a time inside the running app instead of big-bang.

## Conventions

- **Vanilla custom elements first.** Reach for [Lit](https://lit.dev) only if
  the manual bookkeeping starts hurting. `Slider`'s draft-state turned out
  clean in vanilla (draft preservation is implicit — just don't rewrite the
  box while typing). The first list (`IconRadioGroup`) was still fine via
  imperative `createElement` + `replaceChildren` (~25 lines), but that's where
  the verbosity begins — Lit's `html`/`repeat` would pay off at `Patch` scale
  (6 parts × 2 layers). The pressure point is templating/lists, not controls.
- **Property in / event out.** Set state as a DOM property (`el.checked = x`);
  emit changes as a `CustomEvent` whose payload rides in `detail`.
- **Platform-native naming.** Mirror native DOM: `.checked` (boolean) for
  toggles, `.value` (numeric/string) for sliders and text — *not* React's
  uniform `value` prop. Elements should feel like built-ins.
- **Reflect properties to attributes**, so every element also drives from raw
  HTML: `<volca-toggle label="Link Layers" checked>`.
- **Shadow DOM** with a scoped `<style>`. Opt out (`this` as render root) only
  if reusing a global stylesheet is genuinely easier for a given component.
- **ReactNode props become named slots.** `Slider`'s `below`/`belowLabel`
  ReactNode props are light-DOM slotting: `<volca-slider><volca-pitch-picker
  slot="below"/></volca-slider>`, with the row shown only when the slot has
  assigned elements (`slotchange`). Corollary: a slotted child is a DOM
  *child* of the host it's slotted into, so its bubbling events pass through
  that host — listeners on the host must guard on `e.target`.
- **Template-cloned custom children aren't upgraded in the host constructor.**
  Cloning a template with custom elements inside a detached shadow root leaves
  them un-upgraded; setting properties on them creates own properties that
  permanently shadow the class accessors. Call `customElements.upgrade(root)`
  right after cloning when the constructor (or a pre-connection
  `attributeChangedCallback`) sets child properties. Bit `volca-layer`
  (radio `options` vanished) and latently `volca-scaled-slider`.
- **Guard same-value writes that trigger expensive work.** A no-op
  `setAttribute` still fires `attributeChangedCallback`; if that rebuilds DOM
  (e.g. the radio group's `name` → full option rebuild), a parent echoing
  state back on every change would drop focus mid-interaction. Setters that
  rebuild must skip identical values.
- **Cross-shadow styling = custom properties, not selectors.** A parent can't
  reach a child's shadow internals (the React picker did `.midi-picker__live
  .toggle {…}`). Expose the knobs as CSS custom properties, which *do* pierce
  the boundary: `<volca-toggle>` reads `var(--volca-toggle-columns, …)` and the
  picker sets it to compact the Live toggle.
- **Event names:** `change` for live value edits, `apply` for commit-style
  actions (e.g. pasting a patch code). Keep `detail` a plain value or object.
  For a commit that can be *rejected* (React's `onApply(raw): boolean`), make
  the event **cancelable**: the consumer calls `preventDefault()` to reject,
  and `dispatchEvent()`'s boolean return is the synchronous accept/reject.
  `<volca-patch-code>` uses this — accept snaps the draft to canonical, reject
  flags the field invalid and keeps the typed text.
- **Composition & event containment.** A wrapper holds its children in its own
  shadow root and re-emits *translated* events. Child `CustomEvent`s default to
  `composed: false`, so they stop at the shadow boundary — the wrapper catches
  them internally and dispatches its own, and parents never see the inner ones.
  `<volca-scaled-slider>` does exactly this: it turns the inner slider's LCD
  `change` into a CC `change` (verified: one CC event out per drag, no leak).
  Keep `composed: false` (the default) so inner events don't surface as
  duplicates upstream.
- **Accessibility parity.** Preserve the label↔control association on every
  port: wrap the control in a real `<label>` (or use `aria-labelledby`) so it
  keeps its accessible name. Shadow DOM does *not* carry this over for free,
  and `aria-labelledby` ids don't cross shadow boundaries — a wrapping
  `<label>` needs none. Verify in Storybook's a11y panel (Violations 0). The
  `Toggle` port hit exactly this (axe "Form label", Critical).
  Caveat: **axe-green ≠ correctly named.** For multi-control widgets check the
  accessibility *tree*, not just the violation count. The React `Slider` wraps
  range + number in one `<label>`; axe passes it, but the number box ends up
  with *no* accessible name (a wrapping label only names the first control).
  The WC port names both via `aria-labelledby` — a real fix axe never flagged.

## Tooling

- Vite, Vitest, and Storybook themselves are framework-neutral and stay.
- Going away: `@vitejs/plugin-react`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `@types/react*`.
- **Storybook during the migration:** a Storybook instance has a single
  renderer. The React renderer *can* host a custom element; the
  web-components renderer *cannot* host React. So while both kinds coexist we
  keep `@storybook/react-vite` and render new elements inside `.stories.tsx`
  (via a ref — set properties in, listen for the `change` event out). We swap
  to `@storybook/web-components-vite` at the very end.

## Status

- ✅ Branch created off latest `main`.
- ✅ `Toggle` → `<volca-toggle>` — a11y fix applied (wrapping `<label>`),
  Violations 0.
- ✅ `Slider` → `<volca-slider>` — draft-state / commit-on-blur verified
  (type past max → no snap until commit; Escape reverts; range drag
  live-syncs). Two controls named via `aria-labelledby`, Violations 0.
- ✅ `ScaledSlider` → `<volca-scaled-slider>` — composing element wrapping
  `<volca-slider>`; CC↔LCD mapping, inverse-on-drag, snap, and param-switch
  verified; inner LCD event stays contained (one CC event out). Violations 0.
- ✅ `IconRadioGroup` → `<volca-icon-radio-group>` — first list-valued element
  (`options` is an array property). Dynamic list rebuild verified; native
  `<fieldset>`/`<legend>` + wrapped radios name the group and each option,
  Violations 0. Radio `name`s are shadow-scoped, so instances never collide.
- ✅ `PatchCode` → `<volca-patch-code>` — auto-grow textarea, draft-state,
  clipboard copy, and a **cancelable `apply`** (accept vs preventDefault-reject)
  all verified. Added the textarea label React lacked; Violations 0.
- ✅ `PitchPicker` → `<volca-pitch-picker>` — combobox + 128-note popover
  listbox, steppers, draft-state, click-outside (via `composedPath`). All
  behaviour verified. **Fixes a real React bug**: there, Escape after typing
  *commits* the typed note instead of reverting (confirmed live: "D#4" → type
  "C4" → Esc → stays "C4"); the WC reverts because it writes the input value
  synchronously, so the blur-commit sees the canonical label and no-ops. Added
  the combobox aria-label React lacked. Violations 0 (1 axe "inconclusive" —
  manual-review item, not a failure).
- ✅ **Leaf layer complete** — the whole `controls/` directory is ported.
- ✅ `useMidi` → `MidiController` (`src/lib/midiController.ts`) — an
  `EventTarget` store with the access factory injected for testability. 15
  unit tests cover auto-select (single/multiple/none), the statechange
  refresh, selection persistence, denial, and `change` emission.
- ✅ `MidiDevicePicker` → `<volca-midi-device-picker>` — driven by an injected
  `MidiSource` (the store, or a fake): subscribes to `change`, rebuilds its
  view, and its controls call the store. All five views + Live/Disconnect
  interactions verified; Violations 0. `MidiController implements MidiSource`,
  so the real store is a drop-in (the story uses a fake — Web MIDI is absent
  in Storybook).
- ✅ `Layer` → `<volca-layer>` — the first composite: a static template of six
  leaf kinds wired once, one `#sync()` pushing state down, `change` re-emitted
  as `{param, value}` and patch-code `apply` decoded into `replace`. The
  pitch picker rides in the slider's new `below` slot. Behaviour + a11y
  verified (Violations 0; 1 inconclusive from the embedded picker). Surfaced
  the `customElements.upgrade` and same-value-setter lessons above.
- ✅ `Part` → `<volca-part>` — second-tier composite nesting two
  `<volca-layer>`s plus link/output/wave-folder controls and a preset picker
  (`presets` array property). Emits the same `PartChange` union React's
  `onChange` took, with layer events relabelled `{kind:'layer', slot, …}`.
  Verified: full change pipeline across two shadow tiers, linked/pitch-quant
  compound disable rules, preset → `part-replace` round-trip, patch-code
  accept/reject. Violations 0. Cross-shadow layout via custom properties
  (`--volca-layer-width`, group toggle columns).
- ✅ `Patch` → `<volca-patch>` — six parts emitting `PartScopedChange`
  (`{partIndex, change}`). **The Lit question is settled: no.** The part list
  is a fixed six-tuple, never resized, so it's a static template like every
  other composite — vanilla was enough for the whole app. A change four
  tiers deep (radio → layer → part → patch) verified surfacing correctly.
- ✅ `Kit` → `<volca-kit>` — kit name/copy-paste/library picker emitting
  `PatchChange`; partial-kit overlay verified (3-part library pick leaves
  parts 4–6 untouched). Violations 0.
- Known parity issue: the Patch story flags axe `landmark-unique` (Moderate) —
  six identically-named "Layer 1"/"Layer 2" regions. Pre-existing: the React
  Patch story has it too (plus a "Form label" violation the WC port fixed by
  adding aria-labels to comment/code fields). Fix later in both or after
  teardown, not as a silent semantic divergence mid-port.
- ✅ App root → `<volca-app>` (`src/wc/volca-app.ts`, entry `src/main-wc.ts`,
  wired in `index.html`). Owns KitState + the MidiController; the
  onChange/MIDI-mirroring logic ported verbatim from App.tsx. Verified in the
  running app: boot (6 parts, kit, idle picker), both library fetches, a part
  edit re-encoding the kit code, a starter-kit pick overlaying parts 1..N.
  Production bundle: 57 kB JS / 14 kB gzip, no React. Still pending: a
  real-device pass (Connect MIDI → Live → knob → CCs) — automated browsers
  can't answer the MIDI permission prompt.
  Next: teardown (remove React components/deps, swap Storybook).
- ✅ Real-device pass done (Connect MIDI → Live → device reacts).
- ✅ Derived library selection (user feedback from the device pass): the
  preset/kit selects now *show* the entry the current state equals, instead
  of snapping to the placeholder. Derived, not remembered — `lib/libraryMatch`
  compares via `encodePart()` on every sync, so the selection lights up on
  apply, clears on any divergent edit, and re-lights if you edit your way
  back. Kit matching honours partial-kit semantics (only the parts the kit
  specifies count). Tested at both layers: 11 unit tests
  (`libraryMatch.test.ts`) + Storybook `play` interaction tests on the
  WC Part/Kit stories (green in the Storybook UI; note: the headless
  `vitest --project storybook` runner currently crashes at browser launch in
  this environment — "[birpc] rpc is closed" — runs in the UI instead).
