/**
 * <volca-icon-radio-group> — a labelled set of single-choice chips.
 *
 * Web Component port of the React <IconRadioGroup>
 * (src/components/controls/IconRadioGroup.tsx). First element with a
 * list-valued input, so it prototypes dynamic list rendering in vanilla.
 *
 *   - property in   el.options = [{ value, label, iconSrc? }, …]; el.value = 'saw'
 *   - event out     'change' CustomEvent, detail: string (the chosen value)
 *
 * `options` is objects, so it can only be a JS property, never an attribute.
 * `value`/`label`/`name`/`disabled` are plain strings/booleans and reflect to
 * attributes (so the scalar bits still drive from raw HTML).
 *
 * a11y: native <fieldset>/<legend> names the group; each radio is named by its
 * wrapping <label> (img alt or chip text) — no ARIA needed. Radio grouping by
 * `name` is scoped to this shadow root, so instances never cross-talk.
 */

export interface IconRadioOption {
  value: string;
  label: string;
  iconSrc?: string;
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    .icon-radio-group {
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 0.875rem;
    }
    .icon-radio-group__label {
      font-weight: 500;
      padding: 0;
    }
    .icon-radio-group__options {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .icon-radio-group__option {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.25rem;
      height: 2.25rem;
      padding: 0 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      background: #fff;
    }
    .icon-radio-group__option.is-checked {
      background: #2b6cb0;
      color: #fff;
      border-color: #2b6cb0;
    }
    .icon-radio-group__option input[type='radio'] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .icon-radio-group__option img {
      width: 1.5rem;
      height: 1.5rem;
      display: block;
    }
    .icon-radio-group__option-text {
      font-size: 0.75rem;
      white-space: nowrap;
    }
    .icon-radio-group:disabled .icon-radio-group__option {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
  <fieldset class="icon-radio-group">
    <legend class="icon-radio-group__label"></legend>
    <div class="icon-radio-group__options"></div>
  </fieldset>
`;

export class VolcaIconRadioGroup extends HTMLElement {
  static observedAttributes = ['label', 'name', 'value', 'disabled'];

  #fieldset: HTMLFieldSetElement;
  #legend: HTMLElement;
  #optionsEl: HTMLElement;
  #options: IconRadioOption[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#fieldset = root.querySelector('fieldset')!;
    this.#legend = root.querySelector('legend')!;
    this.#optionsEl = root.querySelector<HTMLElement>('.icon-radio-group__options')!;

    // Delegated so it survives list rebuilds: a radio fired, adopt its value.
    this.#optionsEl.addEventListener('change', (e) => {
      const input = e.target;
      if (input instanceof HTMLInputElement) {
        this.value = input.value;
        this.#emit();
      }
    });
  }

  connectedCallback(): void {
    this.#renderConfig();
    this.#renderOptions();
  }

  attributeChangedCallback(attr: string): void {
    if (attr === 'value') {
      this.#renderSelection();
    } else if (attr === 'name') {
      this.#renderOptions();
    } else {
      this.#renderConfig();
    }
  }

  get options(): IconRadioOption[] {
    return this.#options;
  }
  set options(v: IconRadioOption[]) {
    this.#options = v ?? [];
    this.#renderOptions();
  }

  get value(): string {
    return this.getAttribute('value') ?? '';
  }
  set value(v: string) {
    this.setAttribute('value', v ?? '');
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }
  set label(v: string) {
    this.setAttribute('label', v ?? '');
  }

  get name(): string {
    return this.getAttribute('name') ?? '';
  }
  set name(v: string) {
    this.setAttribute('name', v ?? '');
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.value, bubbles: true }),
    );
  }

  #renderConfig(): void {
    this.#legend.textContent = this.label;
    this.#fieldset.disabled = this.disabled;
  }

  // Full rebuild — used when the option list or the group name changes.
  #renderOptions(): void {
    const name = this.name;
    const value = this.value;
    this.#optionsEl.replaceChildren(
      ...this.#options.map((opt) => {
        const id = `${name}-${opt.value}`;
        const checked = opt.value === value;

        const label = document.createElement('label');
        label.className = 'icon-radio-group__option';
        label.htmlFor = id;
        label.title = opt.label;
        label.classList.toggle('is-checked', checked);

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = id;
        input.name = name;
        input.value = opt.value;
        input.checked = checked;
        label.append(input);

        if (opt.iconSrc) {
          const img = document.createElement('img');
          img.src = opt.iconSrc;
          img.alt = opt.label;
          label.append(img);
        } else {
          const span = document.createElement('span');
          span.className = 'icon-radio-group__option-text';
          span.textContent = opt.label;
          label.append(span);
        }
        return label;
      }),
    );
  }

  // Cheap path — only the selection moved, so just retoggle checked state.
  #renderSelection(): void {
    const value = this.value;
    for (const input of this.#optionsEl.querySelectorAll('input')) {
      const checked = input.value === value;
      input.checked = checked;
      input.closest('label')?.classList.toggle('is-checked', checked);
    }
  }
}

customElements.define('volca-icon-radio-group', VolcaIconRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    'volca-icon-radio-group': VolcaIconRadioGroup;
  }
}
