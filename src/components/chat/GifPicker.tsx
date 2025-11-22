import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GifPickerProps {
	open: boolean;
	onClose: () => void;
	onSelect: (gifUrl: string) => void;
}

interface TenorGif {
	id: string;
	title: string;
	media_formats: {
		gif: { url: string };
		tinygif: { url: string };
	};
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [gifs, setGifs] = useState<TenorGif[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [next, setNext] = useState<string | null>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Tenor API key - in production, this should be in environment variables
	const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || "AIzaSyAhR-CU3EyEAD6dyNH";

	// Keep search query when reopening
	useEffect(() => {
		if (!open) return;

		if (searchQuery.trim()) {
			// Reload with current search when reopening
			searchGifs(searchQuery, true);
		} else {
			// Load trending GIFs on open if no search
			loadTrendingGifs(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	// Debounced search
	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		if (searchQuery.trim()) {
			debounceTimerRef.current = setTimeout(() => {
				searchGifs(searchQuery, true);
			}, 500);
		} else if (searchQuery === "") {
			// Clear search - reset to trending
			setGifs([]);
			setNext(null);
			loadTrendingGifs(true);
		}

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery]);

	const loadTrendingGifs = async (reset = false) => {
		try {
			if (reset) {
				setLoading(true);
				setGifs([]);
			}
			setError(null);

			const url =
				next && !reset
					? `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif&pos=${next}`
					: `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error("Failed to load trending GIFs");
			}

			const data = await response.json();
			if (reset) {
				setGifs(data.results || []);
			} else {
				setGifs((prev) => [...prev, ...(data.results || [])]);
			}
			setNext(data.next || null);
			setHasMore(!!data.next);
		} catch (err) {
			console.error("Error loading trending GIFs:", err);
			setError("Failed to load GIFs. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const searchGifs = async (query: string, reset = false) => {
		if (!query.trim()) {
			loadTrendingGifs(reset);
			return;
		}

		try {
			if (reset) {
				setLoading(true);
				setGifs([]);
			}
			setError(null);

			const url =
				next && !reset
					? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
							query
					  )}&key=${TENOR_API_KEY}&limit=20&media_filter=gif&pos=${next}`
					: `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
							query
					  )}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error("Failed to search GIFs");
			}

			const data = await response.json();
			if (reset) {
				setGifs(data.results || []);
			} else {
				setGifs((prev) => [...prev, ...(data.results || [])]);
			}
			setNext(data.next || null);
			setHasMore(!!data.next);
		} catch (err) {
			console.error("Error searching GIFs:", err);
			setError("Failed to search GIFs. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const target = e.currentTarget;
			const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

			if (scrollBottom < 100 && !loading && hasMore) {
				if (searchQuery.trim()) {
					searchGifs(searchQuery, false);
				} else {
					loadTrendingGifs(false);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[loading, hasMore, searchQuery]
	);

	const handleSelect = (gif: TenorGif) => {
		onSelect(gif.media_formats.gif.url);
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl h-[600px] flex flex-col">
				<DialogHeader>
					<DialogTitle>Choose a GIF</DialogTitle>
				</DialogHeader>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for GIFs..."
						className="pl-10 pr-10"
					/>
					{searchQuery && (
						<Button
							size="icon"
							variant="ghost"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
							onClick={() => {
								setSearchQuery("");
								setNext(null);
								setGifs([]);
								loadTrendingGifs(true);
							}}>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>

				{/* GIF Grid */}
				<ScrollArea className="flex-1" onScroll={handleScroll} ref={scrollAreaRef}>
					{error ? (
						<div className="flex flex-col items-center justify-center h-full text-center p-8">
							<ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">{error}</p>
							<Button onClick={() => loadTrendingGifs(true)} variant="outline" className="mt-4">
								Try Again
							</Button>
						</div>
					) : gifs.length === 0 && loading ? (
						<div className="flex items-center justify-center h-full">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : gifs.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center p-8">
							<ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								{searchQuery ? "No GIFs found" : "No trending GIFs available"}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-4 gap-2 p-2">
							{gifs.map((gif) => (
								<button
									key={gif.id}
									onClick={() => handleSelect(gif)}
									className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all">
									<img
										src={gif.media_formats.tinygif?.url || gif.media_formats.gif.url}
										alt={gif.title}
										className="w-full h-full object-cover"
									/>
								</button>
							))}
							{loading && (
								<div className="col-span-4 flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							)}
						</div>
					)}
				</ScrollArea>

				{/* Footer */}
				<div className="text-xs text-center text-muted-foreground border-t pt-2">
					Powered by Tenor
				</div>
			</DialogContent>
		</Dialog>
	);
}
