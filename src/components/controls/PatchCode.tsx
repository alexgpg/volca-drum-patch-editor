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

  const commit = () => {
    if (draft === value) {
      setInvalid(false);
      return;
    }
    const ok = onApply(draft);
    setInvalid(!ok);
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
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(value);
            setInvalid(false);
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
