import { useState, useEffect } from "react";

const STORAGE_KEY = "discord-clone-layout";

interface LayoutConfig {
	threadPanelWidth: number;
	pinnedPanelWidth: number;
	memberSidebarVisible: boolean;
	channelsSidebarWidth: number;
}

const defaultConfig: LayoutConfig = {
	threadPanelWidth: 400,
	pinnedPanelWidth: 400,
	memberSidebarVisible: true,
	channelsSidebarWidth: 20,
};

export function useLayoutStorage() {
	const [config, setConfig] = useState<LayoutConfig>(() => {
		if (typeof window === "undefined") return defaultConfig;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return { ...defaultConfig, ...JSON.parse(stored) };
			}
		} catch (error) {
			console.error("Error loading layout config:", error);
		}
		return defaultConfig;
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (error) {
			console.error("Error saving layout config:", error);
		}
	}, [config]);

	const updateConfig = (updates: Partial<LayoutConfig>) => {
		setConfig((prev) => ({ ...prev, ...updates }));
	};

	return { config, updateConfig };
}
