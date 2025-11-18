import { useState, useEffect } from "react";
import { Search, X, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { SearchFilters as SearchFiltersComponent } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { searchGroupMessages, type SearchResult, type SearchFilters as SearchFiltersType } from "@/services/search";
import { useGroupStore } from "@/stores/groupStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SearchModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onJumpToMessage?: (groupId: string, channelId: string, messageId: string) => void;
}

export function SearchModal({ open, onOpenChange, onJumpToMessage }: SearchModalProps) {
	const { selectedGroupId } = useGroupStore();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<SearchFiltersType>({});

	useEffect(() => {
		if (open) {
			setQuery("");
			setResults([]);
			setFilters({});
		}
	}, [open]);

	const handleSearch = async () => {
		if (!selectedGroupId || !query.trim()) {
			setResults([]);
			return;
		}

		setLoading(true);

		try {
			const searchResults = await searchGroupMessages(selectedGroupId, query, filters);
			setResults(searchResults);
		} catch (error) {
			console.error("Error searching messages:", error);
			toast.error("Failed to search messages");
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (query.trim() && selectedGroupId) {
			const timeoutId = setTimeout(() => {
				handleSearch();
			}, 500);

			return () => clearTimeout(timeoutId);
		} else {
			setResults([]);
		}
	}, [query, filters, selectedGroupId]);

	const handleJumpToMessage = (result: SearchResult) => {
		if (onJumpToMessage) {
			onJumpToMessage(selectedGroupId!, result.channel.id, result.message.id);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Search Messages</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search messages... (try: from:@user, in:#channel, has:file, has:link)"
							className="pl-10 pr-20"
							autoFocus
						/>
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
							onClick={() => setShowFilters(!showFilters)}>
							<Filter className="h-4 w-4" />
						</Button>
					</div>

					{/* Filters */}
					{showFilters && (
						<SearchFiltersComponent filters={filters} onFiltersChange={setFilters} />
					)}

					{/* Results */}
					<ScrollArea className="flex-1 min-h-[300px] max-h-[500px]">
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : results.length === 0 && query.trim() ? (
							<div className="text-center py-8 text-muted-foreground">
								No messages found
							</div>
						) : results.length > 0 ? (
							<SearchResults
								results={results}
								query={query}
								onJumpToMessage={handleJumpToMessage}
							/>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								Type to search messages across all channels
							</div>
						)}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}

