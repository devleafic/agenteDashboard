import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@heroui/react';

/**
 * SlashCommandMenu
 * - Non-intrusive slash commands for a textarea.
 * - Opens when the user types "/" (respuestas rápidas) or ":" (emojis), followed by optional query (sin espacios antes del cursor).
 * - Filters items by query and inserts the selected text at the current caret position,
 *   replacing the token ("/query" o ":query").
 * - Fácil de extender con más disparadores.
 *
 * Props:
 * - textareaRef: React ref to the target <textarea>
 * - items: Array of quick answers. Each item should have at least: { _id, text }
 * - onOpenChange?: (open: boolean) => void
 * - maxItems?: number (default 8)
 */
// Lista interna de emojis permitidos
const allowedEmojis = [
  { text: '😊', label: 'sonrisa' },
  { text: '😂', label: 'risa' },
  { text: '😍', label: 'enamorado' },
  { text: '👍', label: 'pulgar arriba' },
  { text: '🙏', label: 'gracias' },
  { text: '🎉', label: 'celebración' },
  { text: '🔥', label: 'fuego' },
  { text: '😢', label: 'triste' },
  { text: '😡', label: 'enojo' },
  { text: '🤔', label: 'pensando' },
  { text: '🙌', label: 'bien hecho' },
  { text: '💯', label: 'perfecto' },
  { text: '✅', label: 'hecho' },
  { text: '❌', label: 'cancelado' },
  { text: '📞', label: 'teléfono' },
  { text: '📧', label: 'correo' },
  { text: '📅', label: 'calendario' },
  { text: '⏰', label: 'alarma' },
  { text: '🤝', label: 'acuerdo' },
  { text: '🥳', label: 'fiesta' }
];

export default function SlashCommandMenu({ textareaRef, items = [], onOpenChange, maxItems = 20 }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [trigger, setTrigger] = useState('/'); // '/' respuestas rápidas, ':' emojis
  const triggerIndexRef = useRef(-1); // start index of the current trigger token ("/")

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const base = (searchText && searchText.length > 0 ? searchText : query) || '';
    const q = base.trim().toLowerCase();
    const list = trigger === ':' ? allowedEmojis : (Array.isArray(items) ? items : []);
    if (!q) return list.slice(0, maxItems);
    return list
      .filter(it => {
        const t = (it?.text || '').toLowerCase();
        const lbl = (it?.label || '').toLowerCase();
        return t.includes(q) || lbl.includes(q);
      })
      .slice(0, maxItems);
  }, [items, query, searchText, maxItems, trigger]);

  const setMenuOpen = (val) => {
    setOpen(val);
    if (onOpenChange) onOpenChange(val);
  };

  // Try to detect if we are inside a trigger token like "/query" or ":query".
  const detectTrigger = () => {
    const el = textareaRef?.current;
    if (!el) return setMenuOpen(false);

    const caret = el.selectionStart;
    const value = el.value || '';
    if (caret == null) return setMenuOpen(false);

    // Find nearest '/' or ':' before caret
    const idxSlash = value.lastIndexOf('/', caret - 1);
    const idxColon = value.lastIndexOf(':', caret - 1);
    const candidates = [
      { ch: '/', idx: idxSlash },
      { ch: ':', idx: idxColon }
    ]
      .filter(c => c.idx !== -1)
      .sort((a, b) => b.idx - a.idx); // nearest first

    for (const cand of candidates) {
      const idx = cand.idx;
      const prevChar = idx > 0 ? value[idx - 1] : '\n';
      const isTokenStart = /\s|\n/.test(prevChar) || idx === 0;
      if (!isTokenStart) continue;
      const between = value.slice(idx + 1, caret);
      if (/\s/.test(between)) continue;
      // Valid token found
      triggerIndexRef.current = idx;
      setTrigger(cand.ch);
      setQuery(between);
      setSearchText(between);
      setHighlight(0);
      setMenuOpen(true);
      return;
    }

    // No valid trigger found
    setMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setQuery('');
    setSearchText('');
    setHighlight(0);
    setTrigger('/');
    triggerIndexRef.current = -1;
  };

  // Key handling when menu is open
  const handleKeyDown = (e) => {
    if (!open) return;
    const key = e.key;
    const code = e.code;
    const kc = e.keyCode || e.which;

    const isArrowDown = key === 'ArrowDown' || key === 'Down' || code === 'ArrowDown' || kc === 40;
    const isArrowUp = key === 'ArrowUp' || key === 'Up' || code === 'ArrowUp' || kc === 38;
    const isEnter = key === 'Enter' || kc === 13;
    const isTab = key === 'Tab' || kc === 9;
    const isEsc = key === 'Escape' || key === 'Esc' || kc === 27;
    const isCtrlLike = e.ctrlKey || e.metaKey || e.altKey;
    const isJKDown = isCtrlLike && (key === 'j' || key === 'J');
    const isJKUp = isCtrlLike && (key === 'k' || key === 'K');

    if (isArrowDown || isArrowUp || isEnter || isTab || isEsc || isJKDown || isJKUp) {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      e.stopPropagation();
    }

    if (isArrowDown || isJKDown) {
      setHighlight((h) => (h + 1) % Math.max(filtered.length || 1, 1));
    } else if (isArrowUp || isJKUp) {
      setHighlight((h) => (h - 1 + Math.max(filtered.length || 1, 1)) % Math.max(filtered.length || 1, 1));
    } else if (isEsc) {
      closeMenu();
    } else if (isEnter || isTab) {
      const item = filtered[highlight];
      if (item) applySelection(item);
      else closeMenu();
    }
  };

  // When typing, check if the current token is a trigger and update query accordingly.
  const handleInput = () => {
    if (!open) {
      // The user may have just typed "/"
      detectTrigger();
    } else {
      // Update query while menu is open.
      const el = textareaRef?.current;
      if (!el) return closeMenu();
      const caret = el.selectionStart;
      const value = el.value || '';
      const idx = triggerIndexRef.current;
      if (idx < 0 || idx >= value.length) return closeMenu();

      const between = value.slice(idx + 1, caret);
      if (/\s/.test(between)) return closeMenu();
      setQuery(between);
    }
  };

  // Insert selected item by replacing the token "/query" with the item's text.
  const applySelection = (item) => {
    const el = textareaRef?.current;
    if (!el) return closeMenu();

    const value = el.value || '';
    const idx = triggerIndexRef.current;
    if (idx < 0) return closeMenu();

    const caret = el.selectionStart;
    const before = value.slice(0, idx);
    const after = value.slice(caret);

    const insertText = item?.text || '';
    const newValue = `${before}${insertText}${after}`;

    // Mutate the textarea value and set caret after inserted text
    el.value = newValue;

    const newCaret = (before + insertText).length;
    try {
      el.setSelectionRange(newCaret, newCaret);
    } catch (err) {
      // ignore if not supported
    }

    // Dispatch an input event so React onChange picks up the change
    const event = new Event('input', { bubbles: true });
    el.dispatchEvent(event);

    // Return focus to the textarea after inserting
    try { el.focus(); } catch {}

    closeMenu();
  };

  // Attach listeners
  useEffect(() => {
    const el = textareaRef?.current;
    if (!el) return;

    // Element listeners for detecting trigger and keeping query updated
    const onInput = () => handleInput();
    const onKeyUp = () => detectTrigger();
    el.addEventListener('input', onInput);
    el.addEventListener('keyup', onKeyUp);

    // Clicking outside closes the menu
    const handleDocClick = (e) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target)) return;
      if (el === e.target) return; // keep open while typing
      closeMenu();
    };
    document.addEventListener('mousedown', handleDocClick);

    return () => {
      el.removeEventListener('input', onInput);
      el.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, [textareaRef]);

  // While menu is open, capture keydown at the document level for reliable navigation
  useEffect(() => {
    if (!open) return;
    const el = textareaRef?.current;
    if (!el) return;
    const onDocKeyDown = (e) => {
      const active = document.activeElement;
      const inMenu = containerRef.current && containerRef.current.contains(active);
      if (active !== el && !inMenu) return;
      handleKeyDown(e);
    };
    document.addEventListener('keydown', onDocKeyDown, true);
    return () => document.removeEventListener('keydown', onDocKeyDown, true);
  }, [open, textareaRef, filtered, highlight]);

  // Notify parent of open state changes
  useEffect(() => {
    if (onOpenChange) onOpenChange(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted item visible when navigating
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const child = list.children?.[highlight];
    if (child && typeof child.scrollIntoView === 'function') {
      child.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

  // Focus search input when the menu opens
  useEffect(() => {
    if (!open) return;
    const inputEl = searchRef.current;
    if (inputEl && typeof inputEl.focus === 'function') {
      try { inputEl.focus(); } catch {}
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-2 bottom-12 z-50 w-[32rem] max-w-[calc(100%-1rem)] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      role="listbox"
      aria-label="Comandos rápidos"
    >
      <div className="px-2 py-2 border-b bg-gray-50">
        <Input
          ref={searchRef}
          size="md"
          variant="bordered"
          placeholder={trigger === ':' ? 'Buscar emoji...' : 'Buscar respuestas...'}
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setHighlight(0); }}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label={trigger === ':' ? 'Buscar emoji' : 'Buscar respuestas'}
        />
      </div>
      <ul ref={listRef} className="max-h-96 overflow-auto">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-md text-gray-400">Sin resultados</li>
        ) : (
          filtered.map((it, idx) => (
            <li
              key={it._id || idx}
              className={`px-3 py-2 text-md cursor-pointer select-none whitespace-pre-wrap break-words leading-snug ${
                idx === highlight ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={idx === highlight}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                applySelection(it);
              }}
            >
              {it?.label ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{it.text}</span>
                  <span className="text-gray-600">{it.label}</span>
                </div>
              ) : (
                it?.text || ''
              )}
            </li>
          ))
        )}
      </ul>
      <div className="px-3 py-1.5 text-[12px] text-gray-400 border-t bg-gray-50 flex items-center justify-between">
        <span>Usa ↑/↓ o Ctrl/Alt + J/K</span>
        <span>Enter o Tab para insertar • Esc cierra</span>
      </div>
    </div>
  );
}
