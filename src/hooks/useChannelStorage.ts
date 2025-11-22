const STORAGE_KEY = "discord-clone-selected-channels";

interface ChannelStorage {
	[groupId: string]: string; // groupId -> channelId
}

export function useChannelStorage() {
	const getStoredChannel = (groupId: string | null): string | null => {
		if (!groupId || typeof window === "undefined") return null;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const data: ChannelStorage = JSON.parse(stored);
				return data[groupId] || null;
			}
		} catch (error) {
			console.error("Error reading channel storage:", error);
		}

		return null;
	};

	const setStoredChannel = (groupId: string, channelId: string) => {
		if (typeof window === "undefined") return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			const data: ChannelStorage = stored ? JSON.parse(stored) : {};
			data[groupId] = channelId;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error("Error saving channel storage:", error);
		}
	};

	return { getStoredChannel, setStoredChannel };
}
