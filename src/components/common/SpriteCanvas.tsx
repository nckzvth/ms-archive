import React, { useState } from 'react';
import { Grid, Maximize2, RefreshCw } from 'lucide-react';
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
  origin,
  actions = [],
  activeAction,
  onSelectAction,
  nodePathLabel,
  bgmUrl,
  bgmTrackName,
  isMap,
  mapMinimapUrl,
  isMinimapMode,
  onToggleMinimapMode,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(300); // 100, 200, 300
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);

  // Sync image URL
  React.useEffect(() => {
    setCurrentSrc(imageUrl);
    setImgError(false);
  }, [imageUrl]);

  const handleZoomCycle = () => {
    setZoomLevel((prev) => {
      if (prev === 100) return 200;
      if (prev === 200) return 300;
      return 100;
    });
  };

  const handleImageError = () => {
    if (fallbackUrl && currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
    } else {
      setImgError(true);
    }
  };

  const zoomScale = zoomLevel / 100;

  return (
    <div className="relative w-full h-[220px] rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden border border-outline-variant/30 select-none">
      {/* Crisp 8px Checkerboard SVG background */}
      <svg className="absolute inset-0 w-full h-full opacity-35" height="100%" width="100%">
        <defs>
          <pattern id="canvas-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#e4e4e7" />
            <rect x="8" y="0" width="8" height="8" fill="#f4f4f5" />
            <rect x="0" y="8" width="8" height="8" fill="#f4f4f5" />
            <rect x="8" y="8" width="8" height="8" fill="#e4e4e7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />
      </svg>

      {/* Origin Axis Crosshairs (0, 0) */}
      {showCrosshairs && (
        <>
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-rose-400/35 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-rose-400/35 pointer-events-none" />
          <span className="absolute top-1/2 left-1/2 -translate-y-4 translate-x-1.5 font-code text-[10px] text-rose-500/80 font-medium select-none pointer-events-none">
            (0, 0)
          </span>
        </>
      )}

      {/* Rendered Sprite or Image */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-[90%] max-h-[85%]">
        {imgError ? (
          <div className="flex flex-col items-center justify-center p-4 text-outline font-code text-[11px]">
            <RefreshCw className="w-5 h-5 mb-1 opacity-50" />
            <span>Asset Preview Unavailable</span>
          </div>
        ) : (
          <img
            key={currentSrc}
            src={currentSrc}
            alt="Asset sprite"
            onError={handleImageError}
            style={{
              transform: isMap ? 'none' : `scale(${zoomScale})`,
              transformOrigin: 'center center',
            }}
            className={`rendering-pixelated max-h-[160px] object-contain transition-transform duration-100 ${
              isMap ? 'max-w-full max-h-[170px] rounded shadow-xs' : 'drop-shadow-sm'
            }`}
          />
        )}

        {/* Origin / Action Node Readout Tag */}
        {nodePathLabel && (
          <span className="mt-2 font-code text-[10px] text-on-surface-variant bg-surface-container/90 backdrop-blur-xs px-2 py-0.5 rounded border border-outline-variant/30 select-text">
            {nodePathLabel}
            {origin ? ` [Origin: X:${origin.x}, Y:${origin.y}]` : ''}
          </span>
        )}
      </div>

      {/* Top Right: Map BGM Player if audio exists */}
      {bgmUrl && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <AudioPlayer url={bgmUrl} trackName={bgmTrackName} />
        </div>
      )}

      {/* Bottom Left: Action State Scrubbers */}
      {actions.length > 0 && onSelectAction && (
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded shadow-xs border border-outline-variant/20 max-w-[70%] overflow-x-auto no-scrollbar">
          {actions.map((act) => {
            const isActive = activeAction === act;
            return (
              <button
                key={act}
                onClick={() => onSelectAction(act)}
                className={`px-2 py-0.5 rounded font-label-sm text-[11px] transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {act}
              </button>
            );
          })}
        </div>
      )}

      {/* Map View Toggle (Minimap vs Full Render) */}
      {isMap && mapMinimapUrl && onToggleMinimapMode && (
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded shadow-xs border border-outline-variant/20">
          <button
            onClick={onToggleMinimapMode}
            className={`px-2 py-0.5 rounded font-label-sm text-[11px] transition-colors ${
              !isMinimapMode
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Full Topology
          </button>
          <button
            onClick={onToggleMinimapMode}
            className={`px-2 py-0.5 rounded font-label-sm text-[11px] transition-colors ${
              isMinimapMode
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Minimap HUD
          </button>
        </div>
      )}

      {/* Bottom Right: Canvas Zoom & Grid Toggle Controls */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-surface/90 backdrop-blur-md px-2 py-1 rounded shadow-xs border border-outline-variant/20 text-on-surface-variant font-code text-[11px]">
        <button
          onClick={() => setShowCrosshairs(!showCrosshairs)}
          className={`p-0.5 rounded hover:text-primary transition-colors ${
            showCrosshairs ? 'text-primary' : 'text-outline opacity-60'
          }`}
          title="Toggle Origin Crosshairs"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-outline-variant/50 mx-0.5" />

        <button
          onClick={handleZoomCycle}
          className="hover:text-primary transition-colors font-medium tabular-nums min-w-[32px] text-center"
          title="Cycle Zoom (100%, 200%, 300%)"
        >
          {zoomLevel}%
        </button>

        <button
          onClick={handleZoomCycle}
          className="p-0.5 rounded hover:text-primary transition-colors"
          title="Scale to Fit"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
