import { useEffect } from "react";

export interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	metaKey?: boolean;
	callback: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			for (const shortcut of shortcuts) {
				const keyMatches =
					e.key.toLowerCase() === shortcut.key.toLowerCase() ||
					(shortcut.key === "Cmd" && (e.metaKey || e.ctrlKey));

				// Handle Cmd/Ctrl
				const isMac = navigator.platform.includes("Mac");
				const cmdOrCtrl =
					shortcut.ctrlKey === undefined ||
					(isMac ? e.metaKey === shortcut.ctrlKey : e.ctrlKey === shortcut.ctrlKey);

				const shiftMatches =
					shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;
				const altMatches = shortcut.altKey === undefined || e.altKey === shortcut.altKey;

				if (keyMatches && cmdOrCtrl && shiftMatches && altMatches) {
					e.preventDefault();
					shortcut.callback();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [shortcuts]);
}

