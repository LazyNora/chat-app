import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Message, Channel } from "@/types";
import { getGroupChannels } from "./channels";
import { getGroupMembers } from "./groups";

export interface SearchFilters {
	userId?: string;
	channelId?: string;
	dateFrom?: Date;
	dateTo?: Date;
	contentType?: "text" | "file" | "gif" | "link" | "all";
	hasFile?: boolean;
	hasLink?: boolean;
}

export interface SearchResult {
	message: Message;
	channel: Channel;
	contextBefore?: Message;
	contextAfter?: Message;
}

// Parse search query for operators
export function parseSearchQuery(query: string): {
	baseQuery: string;
	filters: Partial<SearchFilters>;
} {
	const filters: Partial<SearchFilters> = {};
	let baseQuery = query;

	// Parse operators: from:@user, in:#channel, has:file, has:link
	const fromMatch = query.match(/from:@(\w+)/i);
	if (fromMatch) {
		baseQuery = baseQuery.replace(/from:@\w+/gi, "").trim();
		// Will need to resolve username to userId
	}

	const inMatch = query.match(/in:#(\w+)/i);
	if (inMatch) {
		baseQuery = baseQuery.replace(/in:#\w+/gi, "").trim();
		// Will need to resolve channel name to channelId
	}

	if (query.includes("has:file")) {
		filters.hasFile = true;
		baseQuery = baseQuery.replace(/has:file/gi, "").trim();
	}

	if (query.includes("has:link")) {
		filters.hasLink = true;
		baseQuery = baseQuery.replace(/has:link/gi, "").trim();
	}

	return { baseQuery, filters };
}

// Search across all channels in a group
export async function searchGroupMessages(
	groupId: string,
	searchQuery: string,
	filters: SearchFilters = {},
	limitCount: number = 25
): Promise<SearchResult[]> {
	const channels = await getGroupChannels(groupId);
	const members = await getGroupMembers(groupId);
	const { baseQuery, filters: queryFilters } = parseSearchQuery(searchQuery);

	// Merge query filters with provided filters
	const finalFilters = { ...filters, ...queryFilters };

	// Resolve user filter (from query operators)
	let userIdFilter: string | undefined = finalFilters.userId;
	const fromMatch = searchQuery.match(/from:@(\w+)/i);
	if (fromMatch && !userIdFilter) {
		const username = fromMatch[1];
		const member = members.find((m) => m.displayName.toLowerCase() === username.toLowerCase());
		userIdFilter = member?.userId;
	}

	// Resolve channel filter (from query operators)
	let channelIdFilter: string | undefined = finalFilters.channelId;
	const inMatch = searchQuery.match(/in:#(\w+)/i);
	if (inMatch && !channelIdFilter) {
		const channelName = inMatch[1];
		const channel = channels.find((c) => c.name.toLowerCase() === channelName.toLowerCase());
		channelIdFilter = channel?.id;
	}

	// Filter channels to search
	const channelsToSearch = channelIdFilter
		? channels.filter((c) => c.id === channelIdFilter)
		: channels;

	const results: SearchResult[] = [];

	// Search each channel
	for (const channel of channelsToSearch) {
		const messagesRef = collection(db, `groups/${groupId}/channels/${channel.id}/messages`);
		let q = query(
			messagesRef,
			where("deleted", "==", false),
			orderBy("createdAt", "desc"),
			limit(100)
		);

		const snapshot = await getDocs(q);
		let messages = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Message[];

		// Apply filters
		if (userIdFilter) {
			messages = messages.filter((m) => m.senderId === userIdFilter);
		}

		if (finalFilters.hasFile) {
			messages = messages.filter((m) => m.files && m.files.length > 0);
		}

		if (finalFilters.hasLink) {
			messages = messages.filter((m) => {
				const urlRegex = /https?:\/\/[^\s]+/gi;
				return urlRegex.test(m.content);
			});
		}

		if (finalFilters.contentType && finalFilters.contentType !== "all") {
			messages = messages.filter((m) => m.type === finalFilters.contentType);
		}

		if (finalFilters.dateFrom) {
			messages = messages.filter((m) => {
				const msgDate = m.createdAt?.toDate?.() || new Date(0);
				return msgDate >= finalFilters.dateFrom!;
			});
		}

		if (finalFilters.dateTo) {
			messages = messages.filter((m) => {
				const msgDate = m.createdAt?.toDate?.() || new Date(0);
				return msgDate <= finalFilters.dateTo!;
			});
		}

		// Filter by content if baseQuery exists
		if (baseQuery) {
			const lowerQuery = baseQuery.toLowerCase();
			messages = messages.filter(
				(m) =>
					m.content.toLowerCase().includes(lowerQuery) ||
					m.senderName.toLowerCase().includes(lowerQuery)
			);
		}

		// Get context for each message
		for (const message of messages.slice(0, limitCount)) {
			const messageIndex = messages.findIndex((m) => m.id === message.id);
			const contextBefore = messageIndex > 0 ? messages[messageIndex - 1] : undefined;
			const contextAfter =
				messageIndex < messages.length - 1 ? messages[messageIndex + 1] : undefined;

			results.push({
				message,
				channel,
				contextBefore,
				contextAfter,
			});
		}
	}

	// Sort by date (newest first)
	results.sort((a, b) => {
		const dateA = a.message.createdAt?.toMillis?.() || 0;
		const dateB = b.message.createdAt?.toMillis?.() || 0;
		return dateB - dateA;
	});

	return results.slice(0, limitCount);
}

