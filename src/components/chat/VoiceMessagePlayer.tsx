import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
	audioUrl: string;
	duration?: number;
	className?: string;
}

export function VoiceMessagePlayer({ audioUrl, duration, className }: VoiceMessagePlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [audioDuration, setAudioDuration] = useState(duration || 0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [playbackRate, setPlaybackRate] = useState(1);

	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Format time as MM:SS
	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Initialize audio element
	useEffect(() => {
		if (!audioRef.current) {
			audioRef.current = new Audio(audioUrl);
		}

		const audio = audioRef.current;

		const updateTime = () => {
			setCurrentTime(audio.currentTime);
		};

		const updateDuration = () => {
			if (!audioDuration && audio.duration) {
				setAudioDuration(audio.duration);
			}
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		const handleLoadedMetadata = () => {
			setAudioDuration(audio.duration);
		};

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("loadeddata", handleLoadedMetadata);

		audio.volume = isMuted ? 0 : volume;
		audio.playbackRate = playbackRate;

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("loadeddata", handleLoadedMetadata);
		};
	}, [audioUrl, volume, isMuted, playbackRate, audioDuration]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = "";
			}
		};
	}, []);

	const togglePlay = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play().catch((error) => {
				console.error("Error playing audio:", error);
			});
		}
		setIsPlaying(!isPlaying);
	};

	const handleSeek = (value: number[]) => {
		if (audioRef.current) {
			const newTime = value[0];
			audioRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		const newVolume = value[0];
		setVolume(newVolume);
		setIsMuted(newVolume === 0);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
	};

	const toggleMute = () => {
		if (audioRef.current) {
			if (isMuted) {
				audioRef.current.volume = volume;
				setIsMuted(false);
			} else {
				audioRef.current.volume = 0;
				setIsMuted(true);
			}
		}
	};

	const handleSpeedChange = (rate: number) => {
		setPlaybackRate(rate);
		if (audioRef.current) {
			audioRef.current.playbackRate = rate;
		}
	};

	return (
		<div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
			{/* Play/Pause Button */}
			<Button variant="ghost" size="icon" onClick={togglePlay} className="h-10 w-10 shrink-0">
				{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
			</Button>

			{/* Waveform/Progress */}
			<div className="flex-1 min-w-0 space-y-1">
				<Slider
					value={[currentTime]}
					max={audioDuration || 0}
					step={0.1}
					onValueChange={handleSeek}
					className="w-full"
				/>
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(audioDuration || 0)}</span>
				</div>
			</div>

			{/* Volume Control */}
			<div className="flex items-center gap-2 shrink-0">
				<Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
					{isMuted || volume === 0 ? (
						<VolumeX className="h-4 w-4" />
					) : (
						<Volume2 className="h-4 w-4" />
					)}
				</Button>
				<div className="w-20 hidden sm:block">
					<Slider
						value={[isMuted ? 0 : volume]}
						max={1}
						step={0.1}
						onValueChange={handleVolumeChange}
					/>
				</div>
			</div>

			{/* Speed Control */}
			<select
				value={playbackRate}
				onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
				className="text-xs bg-background border rounded px-2 py-1 hidden sm:block">
				<option value={0.5}>0.5x</option>
				<option value={0.75}>0.75x</option>
				<option value={1}>1x</option>
				<option value={1.25}>1.25x</option>
				<option value={1.5}>1.5x</option>
				<option value={2}>2x</option>
			</select>
		</div>
	);
}
