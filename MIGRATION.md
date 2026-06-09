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
   Verify against a real device.
5. **Compose upward:** `Layer` → `Part` → `Kit`/`Patch` → `App`.
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
  Next: `useMidi` → controller, then composites (`Layer` → `Part` →
  `Kit`/`Patch`).
