import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface KeyboardShortcutsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface Shortcut {
	category: string;
	shortcuts: Array<{
		keys: string[];
		description: string;
	}>;
}

const shortcuts: Shortcut[] = [
	{
		category: "Navigation",
		shortcuts: [
			{ keys: ["Cmd", "K"], description: "Open search" },
			{ keys: ["Alt", "↑"], description: "Navigate to previous channel" },
			{ keys: ["Alt", "↓"], description: "Navigate to next channel" },
			{ keys: ["Esc"], description: "Close modals/panels" },
		],
	},
	{
		category: "Messaging",
		shortcuts: [
			{ keys: ["Cmd", "Enter"], description: "Send message" },
			{ keys: ["Shift", "Enter"], description: "New line in message" },
			{ keys: ["@"], description: "Focus mention (at start)" },
		],
	},
	{
		category: "Voice",
		shortcuts: [
			{ keys: ["Cmd", "Shift", "M"], description: "Mute/unmute microphone" },
		],
	},
	{
		category: "General",
		shortcuts: [
			{ keys: ["Cmd", "/"], description: "Show keyboard shortcuts" },
		],
	},
];

export function KeyboardShortcutsModal({
	open,
	onOpenChange,
}: KeyboardShortcutsModalProps) {
	const formatKey = (key: string) => {
		if (key === "Cmd") {
			return navigator.platform.includes("Mac") ? "⌘" : "Ctrl";
		}
		return key;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Keyboard Shortcuts</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{shortcuts.map((category, index) => (
						<div key={category.category}>
							<h3 className="font-semibold mb-3">{category.category}</h3>
							<div className="space-y-2">
								{category.shortcuts.map((shortcut, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between py-2">
										<span className="text-sm text-muted-foreground">
											{shortcut.description}
										</span>
										<div className="flex items-center gap-1">
											{shortcut.keys.map((key, keyIdx) => (
												<>
													{keyIdx > 0 && (
														<span className="text-muted-foreground mx-1">
															+
														</span>
													)}
													<Badge
														variant="outline"
														className="font-mono text-xs px-2 py-1">
														{formatKey(key)}
													</Badge>
												</>
											))}
										</div>
									</div>
								))}
							</div>
							{index < shortcuts.length - 1 && <Separator className="mt-4" />}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

