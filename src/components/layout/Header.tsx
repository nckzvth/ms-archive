import React from 'react';
import { Search, Bookmark, PanelRightClose, PanelRightOpen, Archive, LayoutGrid, Home } from 'lucide-react';
import { RegistryCategory, WzVersion } from '../../types';

interface HeaderProps {
  region: string;
  version: string;
  category: RegistryCategory;
  availableVersions: WzVersion[];
  onSelectVersion: (region: string, version: string) => void;
  onOpenCommandPalette: () => void;
  onOpenBookmarks: () => void;
  bookmarkCount: number;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  region,
  version,
  category,
  availableVersions,
  onSelectVersion,
  onOpenCommandPalette,
  onOpenBookmarks,
  bookmarkCount,
  inspectorOpen,
  onToggleInspector,
}) => {
  const getWzPackageName = (cat: RegistryCategory): string => {
    switch (cat) {
      case 'all':
        return 'All Archives';
      case 'equips':
        return 'Character.wz';
      case 'use':
      case 'etc':
      case 'setup':
        return 'Item.wz';
      case 'cash':
        return 'Cash.wz';
      case 'monsters':
        return 'Mob.wz';
      case 'maps':
        return 'Map.wz';
      case 'npcs':
        return 'Npc.wz';
      case 'quests':
        return 'Quest.wz';
      default:
        return 'Data.wz';
    }
  };

  // Group versions by region
  const groupedVersions = React.useMemo(() => {
    const map = new Map<string, string[]>();
    availableVersions.forEach((v) => {
      const existing = map.get(v.region) || [];
      if (!existing.includes(v.mapleVersionId)) {
        existing.push(v.mapleVersionId);
        map.set(v.region, existing);
      }
    });
    return map;
  }, [availableVersions]);

  return (
    <header className="h-10 bg-surface/90 backdrop-blur-xl z-30 shadow-[0_1px_0_rgba(0,0,0,0.06)] flex items-center justify-between px-space-lg select-none flex-shrink-0 w-full border-b border-outline-variant/20">
      {/* Left: Window controls and Navigation Breadcrumbs */}
      <div className="flex items-center gap-space-md">
        {/* macOS window control dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/70 hover:bg-error transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/70 hover:bg-amber-400 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/70 hover:bg-emerald-400 transition-colors" />
        </div>

        {/* Dynamic WZ Breadcrumbs */}
        <div className="flex items-center gap-space-xs text-on-surface-variant font-code text-code">
          <span className="text-primary font-headline-sm flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold tracking-tight">MS//Archive</span>
          </span>
          <span>/</span>
          <span className="text-on-surface font-medium">v{version}</span>
          <span>/</span>
          <span className="text-on-surface font-medium">{getWzPackageName(category)}</span>
        </div>

        <div className="h-3 w-px bg-surface-container-highest" />

        {/* Region & Version Selector Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={`${region}:${version}`}
            onChange={(e) => {
              const [r, v] = e.target.value.split(':');
              if (r && v) onSelectVersion(r, v);
            }}
            className="bg-surface-container px-2 py-0.5 rounded text-on-surface font-code text-[11px] font-medium border border-outline-variant/30 outline-none cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <option value="MCW:1">MCW v.1 (MapleStory Classic World)</option>
            <option value="MCW:CBT2">MCW v.CBT2 (Classic World Closed Beta 2)</option>
          </select>
        </div>

        <div className="h-3 w-px bg-surface-container-highest" />
        <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-code text-code text-[11px]">
          Read-Only
        </span>
      </div>

      {/* Right: Search, Actions, Bookmarks */}
      <div className="flex items-center gap-space-md">
        {/* Global ⌘K Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-space-md bg-surface-container-low hover:bg-surface-container px-space-md py-1 rounded-lg text-on-surface-variant hover:text-on-surface border border-outline-variant/20 transition-colors shadow-xs"
          title="Search across all entities (⌘K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="font-body-sm text-body-sm hidden sm:inline">
            Search strings, IDs, tags...
          </span>
          <kbd className="px-1.5 py-0.5 bg-surface-container-lowest rounded text-on-surface font-code text-code shadow-xs border border-outline-variant/30 text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* Action Triggers */}
        <div className="flex items-center gap-1 text-on-surface-variant">
          {/* Bookmarks Drawer Trigger */}
          <button
            onClick={onOpenBookmarks}
            className="p-1 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors relative"
            title="Saved Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-code text-[9px] font-bold flex items-center justify-center">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Toggle Inspector Pane */}
          <button
            onClick={onToggleInspector}
            className={`p-1 rounded-lg transition-colors ${
              inspectorOpen
                ? 'hover:bg-surface-container hover:text-on-surface'
                : 'bg-surface-container text-primary font-bold'
            }`}
            title="Toggle Right Inspector"
          >
            {inspectorOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className="h-4 w-px bg-surface-container-highest" />

        {/* Profile / Archive Identifier */}
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-code text-[11px] font-bold">
          MS
        </div>
      </div>
    </header>
  );
};
