import { useEffect } from "react";
import { Hash, Volume2 } from "lucide-react";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { getUserGroups } from "@/services/groups";
import { useGroupChannels } from "@/hooks/useFirestore";
import type { Channel } from "@/types";
import { cn } from "@/lib/utils";

export function GroupSidebar() {
	const { user } = useAuthStore();
	const {
		groups,
		selectedGroupId,
		selectedChannelId,
		channels,
		setGroups,
		setChannels,
		setSelectedChannel,
	} = useGroupStore();

	const { data: firestoreChannels, loading: channelsLoading } = useGroupChannels(selectedGroupId);

	// Load user's groups
	useEffect(() => {
		if (user) {
			getUserGroups(user.uid).then(setGroups);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	// Update channels when they change in Firestore
	useEffect(() => {
		if (firestoreChannels) {
			console.log('firestoreChannels', firestoreChannels);
			setChannels(firestoreChannels);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firestoreChannels]);

	const selectedGroup = groups.find((g) => g.id === selectedGroupId);

	if (!selectedGroupId || !selectedGroup) {
		return (
			<div className="w-60 bg-muted/50 p-4 flex items-center justify-center">
				<p className="text-sm text-muted-foreground">Select a group</p>
			</div>
		);
	}

	return (
		<div className="w-60 bg-muted/50 flex flex-col">
			<div className="p-4 border-b">
				<h2 className="font-semibold truncate">{selectedGroup.name}</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-0.5">
					{channelsLoading ? (
						<p className="text-xs text-muted-foreground p-2">Loading channels...</p>
					) : channels.length === 0 ? (
						<p className="text-xs text-muted-foreground p-2">No channels yet</p>
					) : (
						channels.map((channel: Channel) => (
							<button
								key={channel.id}
								onClick={() => setSelectedChannel(channel.id)}
								className={cn(
									"w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm",
									selectedChannelId === channel.id && "bg-accent"
								)}>
								{channel.type === "text" ? (
									<Hash className="h-4 w-4 text-muted-foreground" />
								) : (
									<Volume2 className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="truncate">{channel.name}</span>
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
