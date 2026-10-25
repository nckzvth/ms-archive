import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import {
  RegistryCategory,
  ItemSummary,
  MobSummary,
  MapSummary,
  NpcSummary,
  QuestSummary,
  isQuestInBand,
  getQuestBandInfo,
} from '../../types';
import {
  getItemIconUrl,
  getMobIconUrl,
  getMapMinimapUrl,
  getNpcIconUrl,
} from '../../api/maplestory';

export type FeedEntity =
  | (ItemSummary & { entityType: 'item' })
  | (MobSummary & { entityType: 'mob' })
  | (MapSummary & { entityType: 'map' })
  | (NpcSummary & { entityType: 'npc' })
  | (QuestSummary & { entityType: 'quest' });

interface StreamFeedProps {
  category: RegistryCategory;
  subCategory: string;
  items: FeedEntity[];
  selectedId: number | null;
  onSelectId: (id: number) => void;
  filterPill: string;
  onFilterPillChange: (pill: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (column: string) => void;
  region: string;
  version: string;
  isLoading: boolean;
}

export const StreamFeed: React.FC<StreamFeedProps> = ({
  category,
  subCategory,
  items = [],
  selectedId,
  onSelectId,
  filterPill,
  onFilterPillChange,
  sortBy,
  sortDirection,
  onToggleSort,
  region,
  version,
  isLoading,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState('');

  // Reset local search and scroll when category or subcategory changes
  useEffect(() => {
    setLocalSearch('');
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [category, subCategory]);

  // Reset scroll whenever filter pill or search query changes to prevent virtualizer offset void
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  };

  const handleFilterPillChange = (pill: string) => {
    onFilterPillChange(pill);
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  };

  // Filter items based on active search input and contextual pill
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    let result = items.filter(Boolean);

    const validPills = getFilterPills();
    const effectiveFilterPill = validPills.includes(filterPill) ? filterPill : 'All';

    // 1. Contextual Filter Strip
    if (effectiveFilterPill && effectiveFilterPill !== 'All') {
      if (category === 'equips') {
        const jobMap: Record<string, string> = {
          War: 'Warrior',
          Mag: 'Magician',
          Bow: 'Bowman',
          Thf: 'Thief',
          Pir: 'Pirate',
        };
        const targetJob = jobMap[effectiveFilterPill];
        if (targetJob) {
          result = result.filter(
            (i) =>
              i &&
              i.entityType === 'item' &&
              (i.requiredJobs?.includes(targetJob) || i.requiredJobs?.includes('Beginner'))
          );
        }
      } else if (category === 'monsters') {
        result = result.filter((i) => {
          if (!i || i.entityType !== 'mob') return false;
          const mobLevel = i.level ?? 1;
          if (effectiveFilterPill === '1-30') return mobLevel >= 1 && mobLevel <= 30;
          if (effectiveFilterPill === '31-60') return mobLevel >= 31 && mobLevel <= 60;
          if (effectiveFilterPill === '61-99') return mobLevel >= 61 && mobLevel <= 99;
          if (effectiveFilterPill === '100+') return mobLevel >= 100;
          if (effectiveFilterPill === 'Bosses') return !!i.isBoss;
          return true;
        });
      } else if (category === 'maps') {
        if (effectiveFilterPill === 'Towns') {
          result = result.filter((i) => i && i.entityType === 'map' && /town|village|city/i.test(i.name || ''));
        } else if (effectiveFilterPill === 'Victoria') {
          result = result.filter(
            (i) => i && i.entityType === 'map' && /victoria|henesys|ellinia|perion|kerning|sleepywood/i.test(i.streetName || '')
          );
        } else if (effectiveFilterPill === 'Ossyria') {
          result = result.filter(
            (i) => i && i.entityType === 'map' && /ossyria|el nath|orbis|dead mine/i.test(i.streetName || '')
          );
        }
      } else if (category === 'quests') {
        result = result.filter((i) => {
          if (!i || i.entityType !== 'quest') return false;
          const lvl = i.minLevel ?? 1;
          return isQuestInBand(lvl, effectiveFilterPill);
        });
      }
    }

    // 2. Local search query filter (instant sub-millisecond in-memory)
    if (localSearch && localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter((i) => {
        if (!i) return false;
        const nameMatch = (i.name || '').toLowerCase().includes(q);
        const idMatch = i.id !== undefined && i.id !== null ? String(i.id).includes(q) : false;
        const levelMatch =
          i.entityType === 'quest' && i.minLevel !== undefined
            ? `level ${i.minLevel}`.includes(q) || `lv ${i.minLevel}`.includes(q)
            : false;
        return nameMatch || idMatch || levelMatch;
      });
    }

    // 3. Sorting
    result = [...result].sort((a, b) => {
      if (!a || !b) return 0;
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'level') {
        const levA: number =
          'requiredLevel' in a
            ? Number(a.requiredLevel) || 0
            : 'level' in a
            ? Number(a.level) || 0
            : 'minLevel' in a
            ? Number(a.minLevel) || 1
            : 0;
        const levB: number =
          'requiredLevel' in b
            ? Number(b.requiredLevel) || 0
            : 'level' in b
            ? Number(b.level) || 0
            : 'minLevel' in b
            ? Number(b.minLevel) || 1
            : 0;
        cmp = levA - levB;
      } else if (sortBy === 'id') {
        cmp = (a.id || 0) - (b.id || 0);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, filterPill, category, localSearch, sortBy, sortDirection]);

  // Virtualizer for smooth 60fps rendering
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 5,
  });

  // Filter strip buttons according to category
  const getFilterPills = () => {
    if (category === 'equips') {
      return ['All', 'War', 'Mag', 'Bow', 'Thf', 'Pir'];
    }
    if (category === 'monsters') {
      return ['All', '1-30', '31-60', '61-99', '100+', 'Bosses'];
    }
    if (category === 'maps') {
      return ['All', 'Towns', 'Victoria', 'Ossyria'];
    }
    if (category === 'quests') {
      return ['All', '1-10', '11-20', '21-30', '31-45', '46-60', '61+'];
    }
    return ['All'];
  };

  const getSortIcon = (col: string) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 text-outline opacity-50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  const activeIndex = filteredItems.findIndex((i) => i.id === selectedId);
  const positionLabel =
    filteredItems.length === 0
      ? '0 items'
      : activeIndex >= 0
      ? `${activeIndex + 1} of ${filteredItems.length}`
      : `${filteredItems.length} items`;

  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant/30 overflow-hidden select-none">
      {/* Top Search & Filter Header */}
      <div className="p-space-sm flex flex-col gap-space-xs border-b border-outline-variant/20 bg-surface-container-lowest z-10 flex-shrink-0">
        {/* Integrated Search Input with instant local state */}
        <div className="relative flex items-center bg-surface-container px-space-sm py-1 rounded">
          <Search className="w-3.5 h-3.5 text-on-surface-variant mr-1.5 flex-shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={`Filter ${category} by name or ID...`}
            className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none"
          />
          {localSearch ? (
            <button
              onClick={() => handleSearchChange('')}
              className="p-0.5 rounded text-on-surface-variant hover:text-on-surface mr-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="px-1 py-0.2 bg-surface-container-lowest font-code text-code rounded text-on-surface-variant shadow-xs text-[10px] border border-outline-variant/30">
              ⌘K
            </span>
          )}
        </div>

        {/* Segmented Quick Class / Level Band Filter */}
        {getFilterPills().length > 1 && (
          <div className="flex items-center p-0.5 bg-surface-container-low rounded border border-outline-variant/20 overflow-x-auto no-scrollbar">
            {getFilterPills().map((pill) => {
              const validPills = getFilterPills();
              const effectivePill = validPills.includes(filterPill) ? filterPill : 'All';
              const isActive = effectivePill === pill;
              return (
                <button
                  key={pill}
                  onClick={() => handleFilterPillChange(pill)}
                  className={`flex-1 py-0.5 px-1.5 rounded text-center font-label-sm text-label-sm transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-lowest shadow-xs text-on-surface font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {category === 'quests' && pill !== 'All' ? `Lv.${pill}` : pill}
                </button>
              );
            })}
          </div>
        )}

        {/* Table sorting column header bar */}
        <div className="flex items-center justify-between px-space-xs pt-1 text-on-surface-variant font-code text-code border-t border-outline-variant/15 mt-0.5">
          <div className="flex items-center gap-space-md">
            <button
              onClick={() => onToggleSort('name')}
              className="flex items-center gap-0.5 text-on-surface hover:text-primary transition-colors cursor-pointer"
            >
              <span>Name</span>
              {getSortIcon('name')}
            </button>
            <button
              onClick={() => onToggleSort('level')}
              className="flex items-center gap-0.5 hover:text-primary transition-colors cursor-pointer"
            >
              <span>{category === 'quests' ? 'Req Lv' : 'Level'}</span>
              {getSortIcon('level')}
            </button>
            <button
              onClick={() => onToggleSort('id')}
              className="flex items-center gap-0.5 hover:text-primary transition-colors cursor-pointer"
            >
              <span>ID</span>
              {getSortIcon('id')}
            </button>
          </div>
          <span className="px-1.5 py-0.2 bg-surface-container-high rounded text-on-surface tabular-nums">
            {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* Subtle Background Sync Bar (Zero Layout Shift) */}
      {isLoading && (
        <div className="h-0.5 w-full bg-amber-500/20 overflow-hidden flex-shrink-0">
          <div className="h-full bg-amber-500 animate-pulse w-full" />
        </div>
      )}

      {/* Feed Virtualized List */}
      <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto">
        {filteredItems.length === 0 && isLoading ? (
          // Cold initial boot skeleton state (stable 54px rows)
          <div className="divide-y divide-outline-variant/15">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-[54px] px-space-md py-1.5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-space-md">
                  <div className="w-9 h-9 rounded bg-surface-container-high" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-28 h-3 rounded bg-surface-container-high" />
                    <div className="w-16 h-2.5 rounded bg-surface-container" />
                  </div>
                </div>
                <div className="w-10 h-3 rounded bg-surface-container-high" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant font-body-sm p-4 text-center">
            <p className="font-medium text-body-sm">
              {category === 'quests'
                ? 'No quests matching criteria'
                : category === 'monsters'
                ? 'No monsters matching criteria'
                : category === 'maps'
                ? 'No maps matching criteria'
                : category === 'npcs'
                ? 'No NPCs matching criteria'
                : `No ${subCategory || category} items matching criteria`}
            </p>
            <span className="text-[11px] text-outline font-code mt-1">
              {category === 'quests'
                ? 'Try adjusting the level requirement band or clearing the search query'
                : 'Try adjusting the filter pill or clearing the search query'}
            </span>
            {localSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="mt-2.5 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-code border border-outline-variant/30 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              // Absolute safety guard against out-of-bounds virtual indices
              if (!item || item.id === undefined || item.id === null) return null;

              const isSelected = item.id === selectedId;

              // Render item icon
              let iconUrl = '';
              if (item.entityType === 'item') {
                iconUrl = getItemIconUrl(region, version, item.id);
              } else if (item.entityType === 'mob') {
                iconUrl = getMobIconUrl(region, version, item.id);
              } else if (item.entityType === 'map') {
                iconUrl = getMapMinimapUrl(region, version, item.id);
              } else if (item.entityType === 'npc') {
                iconUrl = getNpcIconUrl(region, version, item.id);
              } else if (item.entityType === 'quest') {
                iconUrl = getItemIconUrl(region, version, 4030000);
              }

              // Subtitle & Right Tag
              let subtitle = '';
              let rightTag = '';
              let rightSub = '';

              if (item.entityType === 'item') {
                subtitle = `Lev ${item.requiredLevel || 0} • ${item.typeInfo?.subCategory || subCategory}`;
                rightTag = `Lv.${item.requiredLevel || 0}`;
                rightSub = `#${item.id}`;
              } else if (item.entityType === 'mob') {
                subtitle = `Lv. ${item.level || 0} • ${item.mobType || 'Monster'}`;
                rightTag = item.isBoss ? 'BOSS' : `Lv.${item.level || 0}`;
                rightSub = `#${item.id}`;
              } else if (item.entityType === 'map') {
                subtitle = item.streetName || 'World';
                rightTag = 'Map';
                rightSub = `#${item.id}`;
              } else if (item.entityType === 'npc') {
                subtitle = 'Resident NPC';
                rightTag = 'NPC';
                rightSub = `#${item.id}`;
              } else if (item.entityType === 'quest') {
                const qLevel = item.minLevel ?? 1;
                const band = getQuestBandInfo(qLevel);
                subtitle = `Req. Lv. ${qLevel} • ${band.group}`;
                rightTag = `Lv.${qLevel}`;
                rightSub = `#${item.id}`;
              }

              return (
                <div
                  key={`${item.entityType || 'entity'}_${item.id}`}
                  onClick={() => onSelectId(item.id)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`h-[54px] px-space-md py-1.5 flex items-center justify-between cursor-pointer border-b border-outline-variant/15 transition-colors ${
                    isSelected
                      ? 'bg-surface-container-high border-l-[3px] border-l-amber-500 text-primary font-medium shadow-[inset_2px_0_0_currentColor]'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {/* Left: Pixel Icon + Name + Subtitle + Level Badge */}
                  <div className="flex items-center gap-space-md min-w-0 pr-2">
                    <div className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/30 flex items-center justify-center p-0.5 flex-shrink-0 overflow-hidden shadow-xs">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={item.name || ''}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          className="rendering-pixelated max-h-7 max-w-7 object-contain"
                        />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-body-sm text-on-surface truncate">
                          {item.name || `Entity #${item.id}`}
                        </span>
                        {item.entityType === 'mob' && item.isBoss && (
                          <span className="text-[9px] font-code px-1 rounded bg-red-100 text-red-700 font-bold border border-red-200">
                            BOSS
                          </span>
                        )}
                        {item.entityType === 'quest' && (
                          <span className="text-[10px] font-code px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 font-semibold border border-amber-500/30 tabular-nums">
                            Lv. {item.minLevel ?? 1}+
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant truncate font-code">
                        {subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Right: Right Tag & ID */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <span
                      className={`font-code text-body-sm font-semibold tabular-nums ${
                        item.entityType === 'quest'
                          ? isSelected
                            ? 'text-amber-500 font-bold'
                            : 'text-amber-600'
                          : item.entityType === 'mob' && item.isBoss
                          ? 'text-red-600'
                          : isSelected
                          ? 'text-primary'
                          : 'text-on-surface'
                      }`}
                    >
                      {rightTag}
                    </span>
                    <div className="font-code text-code text-on-surface-variant opacity-70">
                      {rightSub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feed Status Bar Footer */}
      <div className="h-6 px-3 flex items-center justify-between text-[11px] font-code text-outline bg-surface-container-low border-t border-outline-variant/20 flex-shrink-0">
        <span>Filter: {category === 'quests' && filterPill !== 'All' ? `Lv.${filterPill}` : filterPill}</span>
        <span>{positionLabel}</span>
      </div>
    </div>
  );
};
