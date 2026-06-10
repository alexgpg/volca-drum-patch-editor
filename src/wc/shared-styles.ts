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
 * MIGRATION.md. The private `--_*` names bind the light-theme defaults in one
 * place and are what rules consume. Discipline: component CSS never uses raw
 * colors — only `var(--_*)`.
 */
export const SHARED_CSS = `
  :host {
    --_accent:        var(--volca-accent, #2b6cb0);
    --_accent-hover:  var(--volca-accent-hover, #2257a0);
    --_accent-soft:   var(--volca-accent-soft, #ebf2fa);
    --_on-accent:     var(--volca-on-accent, #fff);
    --_danger:        var(--volca-danger, #c53030);
    --_text:          var(--volca-text, #333);
    --_muted:         var(--volca-text-muted, #555);
    --_text-disabled: var(--volca-text-disabled, #888);
    --_border:        var(--volca-border, #ccc);
    --_border-soft:   var(--volca-border-soft, #ddd);
    --_surface:       var(--volca-surface, #fff);
    --_surface-1:     var(--volca-surface-1, #fafafa);
    --_surface-2:     var(--volca-surface-2, #f3f3f3);
    --_bg-hover:      var(--volca-bg-hover, #f0f0f0);
    --_bg-disabled:   var(--volca-bg-disabled, #f0f0f0);
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
