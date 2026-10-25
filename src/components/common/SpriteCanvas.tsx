import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface SpriteCanvasProps {
  imageUrl: string;
  fallbackUrl?: string;
  origin?: { x: number; y: number } | null;
  actions?: string[];
  activeAction?: string;
  onSelectAction?: (action: string) => void;
  nodePathLabel?: string;
  bgmUrl?: string;
  bgmTrackName?: string;
  isMap?: boolean;
  mapMinimapUrl?: string;
  isMinimapMode?: boolean;
  onToggleMinimapMode?: () => void;
}

export const SpriteCanvas: React.FC<SpriteCanvasProps> = ({
  imageUrl,
  fallbackUrl,
  bgmUrl,
  bgmTrackName,
  isMap,
  mapMinimapUrl,
  isMinimapMode,
  onToggleMinimapMode,
}) => {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);

  // Sync image URL
  useEffect(() => {
    setCurrentSrc(imageUrl);
    setImgError(false);
  }, [imageUrl]);

  const handleImageError = () => {
    if (fallbackUrl && currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="relative w-full h-[180px] rounded-xl bg-surface-container-low/40 flex items-center justify-center overflow-hidden border border-outline-variant/25 select-none p-4">
      {/* Top Right: Map BGM Player if audio exists */}
      {bgmUrl && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <AudioPlayer url={bgmUrl} trackName={bgmTrackName} />
        </div>
      )}

      {/* Map View Toggle (Minimap vs Full Render) */}
      {isMap && mapMinimapUrl && onToggleMinimapMode && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md p-0.5 rounded-lg border border-outline-variant/30 shadow-xs">
          <button
            onClick={onToggleMinimapMode}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              !isMinimapMode
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Full Field
          </button>
          <button
            onClick={onToggleMinimapMode}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              isMinimapMode
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Minimap HUD
          </button>
        </div>
      )}

      {/* Rendered Sprite or Image (Pure, Centered, Never Clipped) */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {imgError ? (
          <div className="flex flex-col items-center justify-center p-4 text-outline font-code text-xs">
            <RefreshCw className="w-5 h-5 mb-1 opacity-40" />
            <span>Image Unavailable</span>
          </div>
        ) : (
          <img
            key={currentSrc}
            src={currentSrc}
            alt="Asset sprite"
            onError={handleImageError}
            className={`rendering-pixelated max-h-[140px] max-w-[85%] object-contain select-none transition-transform ${
              isMap ? 'max-w-full max-h-[160px] rounded shadow-xs' : 'drop-shadow-sm scale-110'
            }`}
          />
        )}
      </div>
    </div>
  );
};
