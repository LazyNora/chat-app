import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, Wifi } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type VideoQuality = "auto" | "high" | "medium" | "low";

interface VideoQualitySettingsProps {
	quality: VideoQuality;
	onQualityChange: (quality: VideoQuality) => void;
	className?: string;
}

const qualityOptions: Array<{ value: VideoQuality; label: string; description: string }> = [
	{ value: "auto", label: "Auto", description: "Adjusts based on network" },
	{ value: "high", label: "High (720p)", description: "~3-5 Mbps" },
	{ value: "medium", label: "Medium (480p)", description: "~1-2 Mbps" },
	{ value: "low", label: "Low (360p)", description: "~0.5-1 Mbps" },
];

export function VideoQualitySettings({
	quality,
	onQualityChange,
	className,
}: VideoQualitySettingsProps) {
	const [open, setOpen] = useState(false);

	const getBandwidthEstimate = (quality: VideoQuality): string => {
		switch (quality) {
			case "high":
				return "~3-5 Mbps";
			case "medium":
				return "~1-2 Mbps";
			case "low":
				return "~0.5-1 Mbps";
			case "auto":
				return "Variable";
			default:
				return "Unknown";
		}
	};

	const handleQualityChange = (value: VideoQuality) => {
		onQualityChange(value);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" className={cn("h-8 w-8", className)}>
					<Settings className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64" align="end">
				<div className="space-y-4">
					<div>
						<Label className="text-sm font-semibold">Video Quality</Label>
						<p className="text-xs text-muted-foreground mt-1">
							Choose video quality for better performance
						</p>
					</div>

					<Select value={quality} onValueChange={handleQualityChange}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{qualityOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<div className="flex flex-col">
										<span className="font-medium">{option.label}</span>
										<span className="text-xs text-muted-foreground">{option.description}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="pt-2 border-t">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Bandwidth:</span>
							<span className="font-medium">{getBandwidthEstimate(quality)}</span>
						</div>
					</div>

					{quality === "auto" && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
							<Wifi className="h-3 w-3" />
							<span>Quality will adjust automatically based on network conditions</span>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
