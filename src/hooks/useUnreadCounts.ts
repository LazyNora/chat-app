import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getLastSeenMessage } from "@/services/messageSeen";
import { useAuthStore } from "@/stores/authStore";
import type { Channel } from "@/types";

export function useUnreadCounts(groupId: string | null, channels: Channel[]) {
	const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
	const { user } = useAuthStore();

	useEffect(() => {
		if (!groupId || !user || channels.length === 0) {
			setUnreadCounts({});
			return;
		}

		const calculateUnreadCounts = async () => {
			const counts: Record<string, number> = {};

			for (const channel of channels) {
				try {
					const seenStatus = await getLastSeenMessage(user.uid, channel.id);
					if (!seenStatus?.lastSeenMessageId) {
						// If never seen, count all messages
						const messagesRef = collection(
							db,
							`groups/${groupId}/channels/${channel.id}/messages`
						);
						const q = query(
							messagesRef,
							where("deleted", "==", false),
							where("senderId", "!=", user.uid) // Don't count own messages
						);
						const snapshot = await getDocs(q);
						counts[channel.id] = snapshot.size;
					} else {
						// Count messages after last seen
						const lastSeenTimestamp = seenStatus.lastSeenAt?.toDate();
						if (lastSeenTimestamp) {
							const messagesRef = collection(
								db,
								`groups/${groupId}/channels/${channel.id}/messages`
							);
							const q = query(
								messagesRef,
								where("deleted", "==", false),
								where("createdAt", ">", Timestamp.fromDate(lastSeenTimestamp)),
								where("senderId", "!=", user.uid),
								orderBy("createdAt", "desc"),
								limit(100)
							);
							const snapshot = await getDocs(q);
							counts[channel.id] = snapshot.size;
						}
					}
				} catch (error) {
					console.error(`Error calculating unread count for channel ${channel.id}:`, error);
					counts[channel.id] = 0;
				}
			}

			setUnreadCounts(counts);
		};

		calculateUnreadCounts();

		// Refresh every 30 seconds
		const interval = setInterval(calculateUnreadCounts, 30000);
		return () => clearInterval(interval);
	}, [groupId, user, channels]);

	return unreadCounts;
}

