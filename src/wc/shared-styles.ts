/**
 * Design tokens + shared style recipes for every element's shadow root.
 *
 * Usage: templates start with `<style>${SHARED_CSS}</style>` followed by the
 * element's own <style> for layout. Injected as text (not adoptedStyleSheets)
 * deliberately: adopted sheets cascade *after* <style> elements, which would
 * let shared rules beat local overrides — injection keeps the natural order
 * (shared base first, local override wins at equal specificity).
 *
 * Tokens: the public `--volca-*` properties inherit from the document, so a
 * theme is just a block of overrides at :root (or any ancestor) — see
 * MIGRATION.md. The private `--_*` names bind the defaults in one place and
 * are what rules consume. Discipline: component CSS never uses raw colors —
 * only `var(--_*)`.
 *
 * Defaults are light-dark() pairs: the browser picks a side from the active
 * color-scheme, which index.css declares as `light dark` and which inherits
 * through shadow boundaries — so the components follow the OS preference,
 * matching the page's own prefers-color-scheme palette (dark bg #16171d).
 * Surfaces invert by elevation: lightest-on-top in light mode becomes
 * lighter-the-higher in dark.
 */
export const SHARED_CSS = `
  :host {
    --_accent:        var(--volca-accent, light-dark(#2b6cb0, #5b9bd9));
    --_accent-hover:  var(--volca-accent-hover, light-dark(#2257a0, #6faae2));
    --_accent-soft:   var(--volca-accent-soft, light-dark(#ebf2fa, #25303d));
    --_on-accent:     var(--volca-on-accent, light-dark(#fff, #0d1117));
    --_danger:        var(--volca-danger, light-dark(#c53030, #f08080));
    --_text:          var(--volca-text, light-dark(#333, #d6d4dc));
    --_muted:         var(--volca-text-muted, light-dark(#555, #9ca3af));
    --_text-disabled: var(--volca-text-disabled, light-dark(#888, #6a6c78));
    --_border:        var(--volca-border, light-dark(#ccc, #3a3c48));
    --_border-soft:   var(--volca-border-soft, light-dark(#ddd, #2e303a));
    --_surface:       var(--volca-surface, light-dark(#fff, #2a2b34));
    --_surface-1:     var(--volca-surface-1, light-dark(#fafafa, #22232b));
    --_surface-2:     var(--volca-surface-2, light-dark(#f3f3f3, #1c1d24));
    --_bg-hover:      var(--volca-bg-hover, light-dark(#f0f0f0, #333540));
    --_bg-disabled:   var(--volca-bg-disabled, light-dark(#f0f0f0, #23242c));
    --_font-ui:       var(--volca-font-ui, ui-sans-serif, system-ui, sans-serif);
    --_font-mono:     var(--volca-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  }

  /* text inputs, selects, textareas */
  .control {
    box-sizing: border-box;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--_border);
    border-radius: 4px;
    background: var(--_surface);
    font: inherit;
    color: var(--_text);
  }
  .control:focus {
    outline: 2px solid var(--_accent);
    outline-offset: 1px;
    border-color: var(--_accent);
  }
  .control:disabled {
    background: var(--_bg-disabled);
    color: var(--_text-disabled);
  }
  .control--invalid { border-color: var(--_danger); }
  .control--invalid:focus {
    outline-color: var(--_danger);
    border-color: var(--_danger);
  }

  /* buttons */
  .btn {
    border: 1px solid var(--_border);
    border-radius: 4px;
    background: var(--_surface-1);
    color: var(--_text);
    font: inherit;
    cursor: pointer;
  }
  .btn:hover:not(:disabled) { background: var(--_bg-hover); }
  .btn:focus-visible {
    outline: 2px solid var(--_accent);
    outline-offset: 1px;
  }
  .btn:disabled {
    background: var(--_bg-disabled);
    color: var(--_text-disabled);
    cursor: not-allowed;
  }

  /* container frames — squared by design (no radius on frames) */
  .card {
    box-sizing: border-box;
    padding: 1rem;
    border: 1px solid var(--_border);
    background: var(--_surface-2);
    font-family: var(--_font-ui);
  }
  .card--soft {
    border-color: var(--_border-soft);
    background: var(--_surface-1);
  }

  /* clickable <summary> card title */
  .card-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
  }
  .card-title:hover { color: var(--_accent); }

  /* small uppercase heading (group/preset labels) */
  .group-label {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--_muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* "label + select" library row */
  .preset-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .preset-row[hidden] { display: none; }
  .preset-row select {
    flex: 1;
    font-size: 0.875rem;
  }
`;
