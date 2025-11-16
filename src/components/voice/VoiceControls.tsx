import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';
import { Room } from 'livekit-client';
import { toggleMicrophone, toggleCamera, startScreenShare, stopScreenShare } from '@/services/livekit';

interface VoiceControlsProps {
  room: Room | null;
  onDisconnect: () => void;
}

export function VoiceControls({ room, onDisconnect }: VoiceControlsProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  const handleToggleMic = async () => {
    if (!room) return;
    const enabled = await toggleMicrophone(room);
    setMicEnabled(enabled);
  };

  const handleToggleCamera = async () => {
    if (!room) return;
    const enabled = await toggleCamera(room);
    setCameraEnabled(enabled);
  };

  const handleToggleScreenShare = async () => {
    if (!room) return;

    if (screenSharing) {
      await stopScreenShare(room);
      setScreenSharing(false);
    } else {
      await startScreenShare(room);
      setScreenSharing(true);
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <Button
        variant={micEnabled ? 'default' : 'destructive'}
        size="icon"
        onClick={handleToggleMic}
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={cameraEnabled ? 'default' : 'secondary'}
        size="icon"
        onClick={handleToggleCamera}
      >
        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={screenSharing ? 'default' : 'secondary'}
        size="icon"
        onClick={handleToggleScreenShare}
      >
        <Monitor className="h-5 w-5" />
      </Button>

      <Button variant="destructive" size="icon" onClick={onDisconnect}>
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}

