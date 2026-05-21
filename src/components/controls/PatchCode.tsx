import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './PatchCode.css';

export interface PatchCodeProps {
  value: string;
  onApply: (raw: string) => boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function PatchCode({ value, onApply, placeholder, disabled }: PatchCodeProps) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const [justCopied, setJustCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Escape resets draft asynchronously and then blurs; without this
  // flag the blur-driven commit would re-fire onApply with the stale
  // typed text instead of cancelling.
  const skipNextBlur = useRef(false);

  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
    setInvalid(false);
  }

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const apply = (text: string) => {
    const ok = onApply(text);
    setInvalid(!ok);
  };

  const commitOnBlur = () => {
    if (skipNextBlur.current) {
      skipNextBlur.current = false;
      return;
    }
    if (draft === value) {
      setInvalid(false);
      return;
    }
    apply(draft);
  };

  const copy = async () => {
    try {
      // Copy the committed `value`, not the in-flight `draft` — Copy
      // mid-edit returns the last valid state, never half-typed garbage.
      await navigator.clipboard.writeText(value);
      setJustCopied(true);
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setJustCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — user can still triple-click + Cmd/Ctrl+C.
    }
  };

  return (
    <div className="patch-code">
      <textarea
        ref={textareaRef}
        rows={1}
        className={`patch-code__input${invalid ? ' patch-code__input--invalid' : ''}`}
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitOnBlur}
        onPaste={() => {
          // The browser inserts the pasted text into the textarea
          // after onPaste returns; defer to read the post-paste value.
          window.setTimeout(() => {
            const el = textareaRef.current;
            if (el) apply(el.value);
          }, 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply(draft);
          } else if (e.key === 'Escape') {
            setDraft(value);
            setInvalid(false);
            skipNextBlur.current = true;
            e.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        className="patch-code__copy"
        onClick={copy}
        disabled={disabled}
        title="Copy to clipboard"
      >
        {justCopied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
