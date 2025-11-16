import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey;
        const shiftMatches = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || e.altKey === shortcut.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault();
          shortcut.callback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

