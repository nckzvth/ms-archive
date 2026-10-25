import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  trackName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, trackName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // When URL changes, reset player
  useEffect(() => {
    setIsPlaying(false);
    setError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setLoading(true);
      setError(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setError(true);
          setLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cleanTitle = (trackName || 'Classic BGM').replace(/^Bgm\w+\//i, '').replace(/([A-Z])/g, ' $1').trim();

  return (
    <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded shadow-xs border border-outline-variant/30 text-on-surface-variant font-code text-[11px]">
      <audio
        ref={audioRef}
        src={url}
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setError(true);
          setLoading(false);
          setIsPlaying(false);
        }}
      />

      <div className="flex items-center gap-1.5 min-w-0">
        <Music className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-600 animate-pulse' : 'text-outline'}`} />
        <span className="truncate max-w-[140px] text-on-surface font-medium" title={trackName}>
          {cleanTitle}
        </span>
      </div>

      <div className="h-3 w-px bg-outline-variant/40" />

      <button
        onClick={togglePlay}
        disabled={error}
        className="p-1 rounded hover:bg-surface-container text-on-surface transition-colors flex items-center justify-center disabled:opacity-40"
        title={isPlaying ? 'Pause BGM' : 'Play Map BGM'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current" />
        )}
      </button>

      <button
        onClick={toggleMute}
        className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-error" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>

      {loading && <span className="text-[10px] text-amber-600 animate-pulse">Loading...</span>}
      {error && <span className="text-[10px] text-error">N/A</span>}
    </div>
  );
};
