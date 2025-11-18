import { useState, useEffect } from "react";
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

	// Tenor API key - in production, this should be in environment variables
	const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || "AIzaSyAhR-CU3EyEAD6dyNH";

	useEffect(() => {
		if (open) {
			// Load trending GIFs on open
			loadTrendingGifs();
		}
	}, [open]);

	useEffect(() => {
		if (searchQuery) {
			const timeoutId = setTimeout(() => {
				searchGifs();
			}, 500);

			return () => clearTimeout(timeoutId);
		}
	}, [searchQuery]);

	const loadTrendingGifs = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`
			);

			if (!response.ok) {
				throw new Error("Failed to load trending GIFs");
			}

			const data = await response.json();
			setGifs(data.results || []);
		} catch (err) {
			console.error("Error loading trending GIFs:", err);
			setError("Failed to load GIFs. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const searchGifs = async () => {
		if (!searchQuery.trim()) {
			loadTrendingGifs();
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
					searchQuery
				)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`
			);

			if (!response.ok) {
				throw new Error("Failed to search GIFs");
			}

			const data = await response.json();
			setGifs(data.results || []);
		} catch (err) {
			console.error("Error searching GIFs:", err);
			setError("Failed to search GIFs. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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
						className="pl-10"
					/>
					{searchQuery && (
						<Button
							size="icon"
							variant="ghost"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
							onClick={() => setSearchQuery("")}>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>

				{/* GIF Grid */}
				<ScrollArea className="flex-1">
					{error ? (
						<div className="flex flex-col items-center justify-center h-full text-center p-8">
							<ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">{error}</p>
							<Button onClick={loadTrendingGifs} variant="outline" className="mt-4">
								Try Again
							</Button>
						</div>
					) : loading ? (
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
						<div className="grid grid-cols-2 gap-2 p-2">
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

