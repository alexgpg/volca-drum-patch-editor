/**
 * <volca-patch-code> — a monospace textarea + Copy button for a patch code.
 *
 * Web Component port of the React <PatchCode>
 * (src/components/controls/PatchCode.tsx). The richest leaf: auto-growing
 * textarea, draft-state, clipboard copy, and a commit that can be *rejected*.
 *
 *   - property in   el.value = 'vP1:…'
 *   - event out     'apply' CustomEvent (cancelable), detail: string (raw text)
 *
 * The 'apply' event is the headline. React's `onApply(raw): boolean` returns
 * whether the code was accepted; events can't return values, so 'apply' is
 * *cancelable*: the consumer calls preventDefault() to reject (invalid code),
 * and dispatchEvent()'s boolean return is the synchronous accept/reject. On
 * accept the consumer sets el.value to the canonical form; we snap the draft
 * to it. On reject we flag the field invalid and keep the typed text.
 *
 * a11y note: React's textarea had only a placeholder (not an accessible name).
 * We add aria-label="Patch code" so screen readers announce the field.
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .patch-code {
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .patch-code__input {
      flex: 1 1 auto;
      min-width: 0;
      box-sizing: border-box;
      padding: 0.25rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      color: #333;
      resize: none;
      overflow-wrap: anywhere;
      overflow: hidden;
      white-space: pre-wrap;
    }
    .patch-code__input:focus {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
      border-color: #2b6cb0;
    }
    .patch-code__input--invalid {
      border-color: #c53030;
    }
    .patch-code__input--invalid:focus {
      outline-color: #c53030;
      border-color: #c53030;
    }
    .patch-code__input:disabled {
      background: #f0f0f0;
      color: #888;
    }
    .patch-code__copy {
      flex: 0 0 auto;
      padding: 0.25rem 0.625rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fafafa;
      font-family: inherit;
      font-size: 0.75rem;
      color: #333;
      cursor: pointer;
    }
    .patch-code__copy:hover:not(:disabled) {
      background: #f0f0f0;
    }
    .patch-code__copy:focus-visible {
      outline: 2px solid #2b6cb0;
      outline-offset: 1px;
    }
    .patch-code__copy:disabled {
      background: #f0f0f0;
      color: #888;
      cursor: not-allowed;
    }
  </style>
  <div class="patch-code">
    <textarea class="patch-code__input" rows="1" aria-label="Patch code"
      spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
    <button type="button" class="patch-code__copy" title="Copy to clipboard">Copy</button>
  </div>
`;

export class VolcaPatchCode extends HTMLElement {
  static observedAttributes = ['value', 'placeholder', 'disabled'];

  #textarea: HTMLTextAreaElement;
  #copyBtn: HTMLButtonElement;
  #value = '';
  // Escape resets the draft and blurs; this stops the blur-driven commit from
  // re-firing 'apply' with the stale text instead of cancelling.
  #skipNextBlur = false;
  #copyTimer: number | undefined;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#textarea = root.querySelector('textarea')!;
    this.#copyBtn = root.querySelector('button')!;

    this.#textarea.addEventListener('input', () => this.#autogrow());
    this.#textarea.addEventListener('blur', () => this.#commitOnBlur());
    this.#textarea.addEventListener('paste', () => {
      // The browser inserts the pasted text after this handler returns;
      // defer to read the post-paste value.
      window.setTimeout(() => this.#apply(this.#textarea.value), 0);
    });
    this.#textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.#apply(this.#textarea.value);
      } else if (e.key === 'Escape') {
        this.#textarea.value = this.#value;
        this.#setInvalid(false);
        this.#autogrow();
        this.#skipNextBlur = true;
        this.#textarea.blur();
      }
    });

    this.#copyBtn.addEventListener('click', () => void this.#copy());
  }

  connectedCallback(): void {
    this.#renderConfig();
    this.#textarea.value = this.#value;
    this.#autogrow();
  }

  disconnectedCallback(): void {
    if (this.#copyTimer !== undefined) clearTimeout(this.#copyTimer);
  }

  attributeChangedCallback(attr: string): void {
    if (attr === 'value') {
      this.value = this.getAttribute('value') ?? '';
    } else {
      this.#renderConfig();
    }
  }

  get value(): string {
    return this.#value;
  }
  // Setting value is "accepted/external" — resync the draft and clear invalid.
  // No-op guard so an unchanged value never clobbers an in-progress draft.
  set value(v: string) {
    const next = String(v);
    if (next === this.#value) return;
    this.#value = next;
    this.#textarea.value = next;
    this.#setInvalid(false);
    this.#autogrow();
  }

  get placeholder(): string {
    return this.getAttribute('placeholder') ?? '';
  }
  set placeholder(v: string) {
    this.setAttribute('placeholder', v ?? '');
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(v: boolean) {
    this.toggleAttribute('disabled', Boolean(v));
  }

  // Commit: dispatch a cancelable 'apply'. The consumer rejects via
  // preventDefault(); dispatchEvent() returns false when it does.
  #apply(text: string): void {
    const accepted = this.dispatchEvent(
      new CustomEvent('apply', { detail: text, cancelable: true, bubbles: true }),
    );
    this.#setInvalid(!accepted);
    if (accepted) {
      // Snap the draft to canonical even when the consumer's value was a no-op
      // (e.g. re-applying the same code), so it never sticks at typed text.
      this.#textarea.value = this.#value;
      this.#autogrow();
    }
  }

  #commitOnBlur(): void {
    if (this.#skipNextBlur) {
      this.#skipNextBlur = false;
      return;
    }
    if (this.#textarea.value === this.#value) {
      this.#setInvalid(false);
      return;
    }
    this.#apply(this.#textarea.value);
  }

  async #copy(): Promise<void> {
    try {
      // Copy the committed value, never the half-typed draft.
      await navigator.clipboard.writeText(this.#value);
      this.#copyBtn.textContent = 'Copied';
      if (this.#copyTimer !== undefined) clearTimeout(this.#copyTimer);
      this.#copyTimer = window.setTimeout(() => {
        this.#copyBtn.textContent = 'Copy';
      }, 1500);
    } catch {
      // Clipboard unavailable — user can still select + copy manually.
    }
  }

  #setInvalid(invalid: boolean): void {
    this.#textarea.classList.toggle('patch-code__input--invalid', invalid);
  }

  #renderConfig(): void {
    this.#textarea.placeholder = this.placeholder;
    this.#textarea.disabled = this.disabled;
    this.#copyBtn.disabled = this.disabled;
  }

  #autogrow(): void {
    const el = this.#textarea;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}

customElements.define('volca-patch-code', VolcaPatchCode);

declare global {
  interface HTMLElementTagNameMap {
    'volca-patch-code': VolcaPatchCode;
  }
}
