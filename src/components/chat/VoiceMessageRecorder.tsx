import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceMessageRecorderProps {
	onSend: (audioBlob: Blob, duration: number) => void;
	onCancel: () => void;
}

export function VoiceMessageRecorder({ onSend, onCancel }: VoiceMessageRecorderProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [duration, setDuration] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [waveform, setWaveform] = useState<number[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const startTimeRef = useRef<number>(0);
	const pausedDurationRef = useRef<number>(0);
	const pausedStartRef = useRef<number>(0);

	// Format duration as MM:SS
	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			// Setup audio context for waveform visualization
			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyserRef.current = analyser;

			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			// Setup MediaRecorder
			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
			});
			mediaRecorderRef.current = mediaRecorder;

			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(audioChunksRef.current, {
					type: mediaRecorder.mimeType,
				});
				setAudioBlob(blob);
			};

			mediaRecorder.start();
			setIsRecording(true);
			startTimeRef.current = Date.now();
			pausedDurationRef.current = 0;

			// Start waveform visualization
			updateWaveform();
			updateDuration();
		} catch (error) {
			console.error("Error starting recording:", error);
			toast.error("Failed to start recording. Please check microphone permissions.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			setIsPaused(false);

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		}
	};

	const pauseRecording = () => {
		if (mediaRecorderRef.current && isRecording && !isPaused) {
			mediaRecorderRef.current.pause();
			setIsPaused(true);
			pausedStartRef.current = Date.now();
		} else if (mediaRecorderRef.current && isRecording && isPaused) {
			mediaRecorderRef.current.resume();
			setIsPaused(false);
			pausedDurationRef.current += Date.now() - pausedStartRef.current;
			updateDuration();
		}
	};

	const updateWaveform = () => {
		if (!analyserRef.current || !isRecording || isPaused) {
			setWaveform([]);
			if (animationFrameRef.current) {
				animationFrameRef.current = requestAnimationFrame(updateWaveform);
			}
			return;
		}

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Downsample for visualization (take every 4th value)
		const downsampled: number[] = [];
		for (let i = 0; i < dataArray.length; i += 4) {
			downsampled.push(dataArray[i] / 255);
		}
		setWaveform(downsampled);

		animationFrameRef.current = requestAnimationFrame(updateWaveform);
	};

	const updateDuration = () => {
		if (!isRecording || isPaused) {
			setTimeout(updateDuration, 100);
			return;
		}

		const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
		setDuration(Math.max(0, elapsed));

		setTimeout(updateDuration, 100);
	};

	const handleSend = async () => {
		if (!audioBlob) return;

		setIsProcessing(true);
		try {
			onSend(audioBlob, Math.floor(duration));
		} catch (error) {
			console.error("Error sending voice message:", error);
			toast.error("Failed to send voice message");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCancel = () => {
		stopRecording();
		setAudioBlob(null);
		setDuration(0);
		setWaveform([]);
		onCancel();
	};

	if (audioBlob) {
		return (
			<div className="p-4 border rounded-lg bg-muted/50 space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
							<Mic className="h-6 w-6 text-primary" />
						</div>
						<div>
							<p className="font-medium">Voice Message</p>
							<p className="text-sm text-muted-foreground">{formatDuration(duration)}</p>
						</div>
					</div>
					<audio
						src={URL.createObjectURL(audioBlob)}
						controls
						className="hidden"
						autoPlay={false}
					/>
				</div>

				<div className="flex items-center gap-2 justify-end">
					<Button variant="ghost" size="sm" onClick={handleCancel} disabled={isProcessing}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
					<Button onClick={handleSend} disabled={isProcessing}>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Sending...
							</>
						) : (
							<>
								<Send className="h-4 w-4 mr-2" />
								Send
							</>
						)}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 border rounded-lg bg-muted/50 space-y-4">
			{isRecording ? (
				<>
					{/* Waveform Visualization */}
					<div className="flex items-center gap-1 h-12">
						{waveform.length > 0 ? (
							waveform.map((value, index) => (
								<div
									key={index}
									className="flex-1 bg-primary rounded-sm transition-all"
									style={{
										height: `${Math.max(4, value * 40)}px`,
										opacity: value > 0.1 ? 1 : 0.3,
									}}
								/>
							))
						) : (
							<div className="flex-1 text-center text-muted-foreground text-sm">Listening...</div>
						)}
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"h-3 w-3 rounded-full",
									isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
								)}
							/>
							<span className="text-sm font-medium">{formatDuration(duration)}</span>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={pauseRecording}>
								{isPaused ? "Resume" : "Pause"}
							</Button>
							<Button variant="destructive" size="sm" onClick={stopRecording}>
								<Square className="h-4 w-4 mr-2" />
								Stop
							</Button>
						</div>
					</div>
				</>
			) : (
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium">Record Voice Message</p>
						<p className="text-sm text-muted-foreground">Click the microphone to start recording</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={handleCancel}>
							Cancel
						</Button>
						<Button onClick={startRecording} size="lg" className="rounded-full w-14 h-14 p-0">
							<Mic className="h-6 w-6" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
