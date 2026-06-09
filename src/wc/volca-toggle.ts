/**
 * <volca-toggle> — a labelled on/off switch.
 *
 * The first Web Component port (see MIGRATION.md). It establishes the
 * conventions every later element follows:
 *
 *   - property in   el.checked = true / el.label = 'Link Layers'
 *   - event out     'change' CustomEvent, detail: boolean
 *   - reflection    properties mirror to attributes, so it also drives from
 *                   raw HTML:  <volca-toggle label="Link Layers" checked>
 *
 * No framework — a plain custom element with a shadow root. The React
 * <Toggle> this replaces lives at src/components/controls/Toggle.tsx.
 */

// Parsed once at module load, cloned per instance.
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.875rem;
    }
    :host([disabled]) {
      color: #888;
    }
    /* The <label> wraps the control so the checkbox takes its accessible
       name from the text — and clicking the row toggles it. */
    .row {
      display: grid;
      /* Columns/gap are themable from outside via custom properties (they
         pierce the shadow boundary, unlike selectors). Defaults match the
         original layout, so untouched usages are unchanged. */
      grid-template-columns: var(--volca-toggle-columns, 6rem 1fr 3rem);
      align-items: center;
      gap: var(--volca-toggle-gap, 0.5rem);
      cursor: pointer;
    }
    :host([disabled]) .row {
      cursor: not-allowed;
    }
    .label {
      font-weight: 500;
    }
    input {
      width: 1rem;
      height: 1rem;
      margin: 0;
      justify-self: start;
      accent-color: #2b6cb0;
      cursor: inherit;
    }
    .state {
      text-align: right;
      color: #555;
      font-variant-numeric: tabular-nums;
    }
  </style>
  <label class="row">
    <span class="label"></span>
    <input type="checkbox" />
    <span class="state"></span>
  </label>
`;

export class VolcaToggle extends HTMLElement {
  static observedAttributes = ['label', 'checked', 'disabled'];

  #input: HTMLInputElement;
  #labelEl: HTMLElement;
  #stateEl: HTMLElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#input = root.querySelector<HTMLInputElement>('input')!;
    this.#labelEl = root.querySelector<HTMLElement>('.label')!;
    this.#stateEl = root.querySelector<HTMLElement>('.state')!;

    // Event out: the native checkbox flips, we reflect it onto ourselves and
    // re-emit a single semantic `change` carrying the boolean in `detail`.
    this.#input.addEventListener('change', () => {
      this.checked = this.#input.checked;
      this.dispatchEvent(
        new CustomEvent('change', { detail: this.checked, bubbles: true }),
      );
    });
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  // Properties reflect to attributes; the attributes are the single source of
  // truth that #render() reads back from.
  get checked(): boolean {
    return this.hasAttribute('checked');
  }
  set checked(value: boolean) {
    this.toggleAttribute('checked', Boolean(value));
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(value: boolean) {
    this.toggleAttribute('disabled', Boolean(value));
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }
  set label(value: string) {
    this.setAttribute('label', value ?? '');
  }

  #render(): void {
    this.#labelEl.textContent = this.label;
    this.#stateEl.textContent = this.checked ? 'On' : 'Off';
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
  }
}

customElements.define('volca-toggle', VolcaToggle);

declare global {
  interface HTMLElementTagNameMap {
    'volca-toggle': VolcaToggle;
  }
}
