"use client";

import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "O", description: "Upper Archive (Sanctuary Overview)" },
  { key: "T", description: "The Chronicle (Timeline View)" },
  { key: "L", description: "The Correspondence (Letters Chamber)" },
  { key: "A", description: "The Vault (Archive & Search)" },
  { key: "H", description: "The Horizon (Future Promises)" },
  { key: "Escape", description: "Close modal / Return to previous view" },
  { key: "?", description: "Toggle this keyboard shortcuts guide" },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl border border-background-border bg-background-surface p-6 shadow-2xl focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-background-border pb-4">
          <h2
            id="shortcuts-dialog-title"
            className="font-serif text-xl font-semibold text-white tracking-wide"
          >
            Sanctuary Navigation
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-background-elevated hover:text-white focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close keyboard shortcuts dialog"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              &times;
            </span>
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
          Navigate Aethelgard seamlessly using your keyboard. Shortcuts are active
          when not typing in form inputs.
        </p>

        <ul className="mt-4 divide-y divide-background-border/50 text-sm">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.key}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-gray-300">{shortcut.description}</span>
              <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded bg-background-elevated border border-background-border text-xs font-mono font-medium text-primary-light shadow-inner">
                {shortcut.key}
              </kbd>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-background-border/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-background-elevated text-xs font-medium text-gray-300 hover:bg-background-border hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
