import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  Shield,
  FlaskConical,
  Boxes,
  Armchair,
  ShoppingBag,
  Ghost,
  MapPin,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  onSelectCategory?: (category: RegistryCategory, subCategory?: string, group?: string, filterPill?: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function getCategoryFilterPills(category: RegistryCategory): string[] {
  if (category === 'all') {
    return ['All', 'Equips', 'Use', 'Etc', 'Setup', 'Cash', 'Monsters', 'Maps', 'NPCs', 'Quests'];
  }
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
}

const CATEGORIES: {
  id: RegistryCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'equips', label: 'Equips', icon: Shield },
  { id: 'use', label: 'Use', icon: FlaskConical },
  { id: 'etc', label: 'Etc', icon: Boxes },
  { id: 'setup', label: 'Setup', icon: Armchair },
  { id: 'cash', label: 'Cash', icon: ShoppingBag },
  { id: 'monsters', label: 'Monsters', icon: Ghost },
  { id: 'maps', label: 'Maps', icon: MapPin },
  { id: 'npcs', label: 'NPCs', icon: User },
  { id: 'quests', label: 'Quests', icon: FileText },
];

const EQUIP_SUBCATEGORIES = [
  { label: 'All Equips', sub: '', group: '' },
  { label: '1H Swords', sub: 'One-Handed Sword', group: 'One-Handed' },
  { label: '2H Swords', sub: 'Two-Handed Sword', group: 'Two-Handed' },
  { label: 'Daggers', sub: 'Dagger', group: 'One-Handed' },
  { label: 'Bows', sub: 'Bow', group: 'Two-Handed' },
  { label: 'Crossbows', sub: 'Crossbow', group: 'Two-Handed' },
  { label: 'Claws', sub: 'Claw', group: 'Two-Handed' },
  { label: 'Wands', sub: 'Wand', group: 'One-Handed' },
  { label: 'Staves', sub: 'Staff', group: 'One-Handed' },
  { label: 'Spears', sub: 'Spear', group: 'Two-Handed' },
  { label: 'Polearms', sub: 'Pole Arm', group: 'Two-Handed' },
  { label: 'Axes', sub: 'One-Handed Axe', group: 'One-Handed' },
  { label: 'Blunt Weapons', sub: 'One-Handed Blunt Weapon', group: 'One-Handed' },
  { label: 'Hats & Helmets', sub: 'Hat', group: 'Armor & Clothing' },
  { label: 'Tops', sub: 'Top', group: 'Armor & Clothing' },
  { label: 'Bottoms', sub: 'Bottom', group: 'Armor & Clothing' },
  { label: 'Overalls', sub: 'Overall', group: 'Armor & Clothing' },
  { label: 'Gloves', sub: 'Glove', group: 'Armor & Clothing' },
  { label: 'Shoes', sub: 'Shoes', group: 'Armor & Clothing' },
  { label: 'Shields', sub: 'Shield', group: 'Armor & Clothing' },
  { label: 'Capes', sub: 'Cape', group: 'Armor & Clothing' },
];

const USE_SUBCATEGORIES = [
  { label: 'All Use', sub: '' },
  { label: 'Potions', sub: 'Potion' },
  { label: 'Scrolls', sub: 'Scroll' },
  { label: 'Town Return', sub: 'Town Return Scroll' },
  { label: 'Projectiles', sub: 'Projectile/Thrown' },
  { label: 'Transformation', sub: 'Transformation' },
];

const ETC_SUBCATEGORIES = [
  { label: 'All Etc', sub: '' },
  { label: 'Monster Drops', sub: 'Monster Drop' },
  { label: 'Ores & Minerals', sub: 'Ore/Mineral' },
  { label: 'Quest Items', sub: 'Quest Item' },
  { label: 'Crafting', sub: 'Crafting Material' },
];

const SETUP_SUBCATEGORIES = [
  { label: 'All Setup', sub: '' },
  { label: 'Chairs', sub: 'Chair' },
  { label: 'Decorations', sub: 'Decoration' },
  { label: 'Other', sub: 'Other' },
];

const CASH_SUBCATEGORIES = [
  { label: 'All Cash', sub: '' },
  { label: 'Pets', sub: 'Pet' },
  { label: 'Covers', sub: 'Cash Weapon' },
  { label: 'Effects', sub: 'Effect' },
  { label: 'Packages', sub: 'Package' },
];

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
  onSelectCategory,
  searchQuery = '',
  onSearchQueryChange,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Sync external searchQuery prop if it updates
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Reset local search and scroll when category or subcategory changes (unless searchQuery was set)
  useEffect(() => {
    if (!searchQuery) {
      setLocalSearch('');
    }
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [category, subCategory, searchQuery]);

  // Reset scroll whenever filter pill or search query changes to prevent virtualizer offset void
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchQueryChange?.(value);
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

    const validPills = getCategoryFilterPills(category);
    const effectiveFilterPill = validPills.includes(filterPill) ? filterPill : 'All';

    // 1. Contextual Filter Strip
    if (effectiveFilterPill && effectiveFilterPill !== 'All') {
      if (category === 'all') {
        const catMap: Record<string, string> = {
          Equips: 'item',
          Use: 'item',
          Etc: 'item',
          Setup: 'item',
          Cash: 'item',
          Monsters: 'mob',
          Maps: 'map',
          NPCs: 'npc',
          Quests: 'quest',
        };
        const targetType = catMap[effectiveFilterPill];
        if (targetType) {
          result = result.filter((i) => i && i.entityType === targetType);
        }
      } else if (category === 'equips') {
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
        const streetMatch = i.entityType === 'map' && i.streetName ? i.streetName.toLowerCase().includes(q) : false;
        const subCatMatch = i.entityType === 'item' && i.typeInfo?.subCategory ? i.typeInfo.subCategory.toLowerCase().includes(q) : false;
        return nameMatch || idMatch || levelMatch || streetMatch || subCatMatch;
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

  // Search submit handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
    if (filteredItems.length > 0) {
      onSelectId(filteredItems[0].id);
    }
  };

  return (
    <div className="flex-1 min-w-[420px] flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant/30 overflow-hidden select-none">
      {/* Top Search & Category Selectors Header */}
      <div className="p-3 flex flex-col gap-2 border-b border-outline-variant/20 bg-surface-container-lowest z-10 flex-shrink-0 shadow-xs">
        {/* Row 1: Search Input with dedicated Search Button */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center bg-surface-container px-3 py-1.5 rounded-md border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
            <Search className="w-3.5 h-3.5 text-on-surface-variant mr-2 flex-shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                category === 'all'
                  ? 'Search entire archive (items, mobs, maps, NPCs, quests)...'
                  : `Search ${category} by name or ID...`
              }
              className="w-full bg-transparent font-body-sm text-[13px] text-on-surface placeholder:text-on-surface-variant outline-none"
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-0.5 rounded text-on-surface-variant hover:text-on-surface mr-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-1 py-0.2 bg-surface-container-lowest font-code text-code rounded text-on-surface-variant shadow-xs text-[10px] border border-outline-variant/30">
                ⌘K
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-primary hover:bg-neutral-800 text-on-primary rounded font-code text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-shrink-0"
            title="Execute Search & Load Results"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Row 2: Collapsible / Expandable Category Selectors Strip */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 py-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(cat.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    isActive
                      ? 'bg-primary text-on-primary font-semibold shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse Subcategories Toggle */}
          <button
            type="button"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-code text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/20 flex-shrink-0 cursor-pointer ml-1"
            title={isFiltersExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
          >
            {isFiltersExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span className="hidden sm:inline">Filters</span>
              </>
            )}
          </button>
        </div>

        {/* Row 3 (Expandable): Subcategory & Level Filter Strip */}
        {isFiltersExpanded && (
          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-outline-variant/15">
            {/* Contextual Filter Pills (Level bands, Jobs, Regions) */}
            {getCategoryFilterPills(category).length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  {category === 'equips' ? 'Job Class:' : category === 'quests' ? 'Level Req:' : 'Filter:'}
                </span>
                {getCategoryFilterPills(category).map((pill) => {
                  const validPills = getCategoryFilterPills(category);
                  const effectivePill = validPills.includes(filterPill) ? filterPill : 'All';
                  const isActive = effectivePill === pill;
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleFilterPillChange(pill)}
                      className={`px-2 py-0.5 rounded text-[11px] font-label-sm transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-white font-semibold shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                      }`}
                    >
                      {category === 'quests' && pill !== 'All' ? `Lv.${pill}` : pill}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Subcategories (Weapons, Potions, Scrolls, Chairs, etc.) */}
            {category === 'equips' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  Type:
                </span>
                {EQUIP_SUBCATEGORIES.map((eq) => {
                  const isActive = subCategory === eq.sub || (!subCategory && eq.sub === 'One-Handed Sword');
                  return (
                    <button
                      key={eq.label}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory('equips', eq.sub, eq.group, filterPill);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-code transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/50 shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {eq.label}
                    </button>
                  );
                })}
              </div>
            )}

            {category === 'use' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  Category:
                </span>
                {USE_SUBCATEGORIES.map((u) => {
                  const isActive = subCategory === u.sub || (!subCategory && u.sub === 'Potion');
                  return (
                    <button
                      key={u.label}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory('use', u.sub, '', filterPill);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-code transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/50 shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {u.label}
                    </button>
                  );
                })}
              </div>
            )}

            {category === 'etc' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  Category:
                </span>
                {ETC_SUBCATEGORIES.map((e) => {
                  const isActive = subCategory === e.sub || (!subCategory && e.sub === 'Monster Drop');
                  return (
                    <button
                      key={e.label}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory('etc', e.sub, '', filterPill);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-code transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/50 shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            )}

            {category === 'setup' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  Category:
                </span>
                {SETUP_SUBCATEGORIES.map((s) => {
                  const isActive = subCategory === s.sub || (!subCategory && s.sub === 'Chair');
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory('setup', s.sub, '', filterPill);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-code transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/50 shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}

            {category === 'cash' && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-code text-outline uppercase tracking-wider mr-1 flex-shrink-0">
                  Category:
                </span>
                {CASH_SUBCATEGORIES.map((c) => {
                  const isActive = subCategory === c.sub || (!subCategory && c.sub === 'Pet');
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory('cash', c.sub, '', filterPill);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-code transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isActive
                          ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/50 shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Row 4: Column header & sorting controls bar */}
        <div className="flex items-center justify-between px-1 pt-1.5 text-on-surface-variant font-code text-code border-t border-outline-variant/15">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onToggleSort('name')}
              className="flex items-center gap-1 text-on-surface hover:text-primary transition-colors cursor-pointer font-medium"
            >
              <span>Name</span>
              {getSortIcon('name')}
            </button>
            <button
              type="button"
              onClick={() => onToggleSort('level')}
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <span>{category === 'quests' ? 'Req Lv' : 'Level'}</span>
              {getSortIcon('level')}
            </button>
            <button
              type="button"
              onClick={() => onToggleSort('id')}
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <span>ID</span>
              {getSortIcon('id')}
            </button>
          </div>
          <span className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface font-semibold tabular-nums text-[11px]">
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
              <div key={idx} className="h-[54px] px-3.5 py-1.5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
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
                type="button"
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
                subtitle = `Lev ${item.requiredLevel || 0} • ${item.typeInfo?.subCategory || subCategory || 'Equip'}`;
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
                  className={`h-[54px] px-3.5 py-1.5 flex items-center justify-between cursor-pointer border-b border-outline-variant/15 transition-colors ${
                    isSelected
                      ? 'bg-surface-container-high border-l-[3px] border-l-amber-500 text-primary font-medium shadow-[inset_2px_0_0_currentColor]'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {/* Left: Pixel Icon + Name + Subtitle */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/30 flex items-center justify-center p-0.5 flex-shrink-0 overflow-hidden shadow-xs">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={item.name || ''}
                          className="w-full h-full rendering-pixelated object-contain"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-code text-outline">#{item.id}</span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-[13px] text-on-surface truncate font-semibold">
                        {item.name || `Unnamed #${item.id}`}
                      </span>
                      <span className="font-code text-[11px] text-on-surface-variant truncate">
                        {subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Supplemental Tag for flexible width */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {item.entityType === 'item' && item.requiredJobs && item.requiredJobs.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[10px] text-on-surface-variant">
                        {item.requiredJobs.join(', ')}
                      </span>
                    )}
                    {item.entityType === 'mob' && item.isBoss && (
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-code text-[10px] font-bold border border-red-500/20">
                        BOSS
                      </span>
                    )}
                    {item.entityType === 'quest' && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-code text-[10px] font-medium border border-amber-500/20">
                        {getQuestBandInfo(item.minLevel ?? 1).group}
                      </span>
                    )}
                  </div>

                  {/* Right: Badge and ID */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={`px-1.5 py-0.2 rounded font-code text-[10.5px] tabular-nums font-semibold ${
                        item.entityType === 'quest'
                          ? isSelected
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-amber-500/15 text-amber-700'
                          : item.entityType === 'mob' && item.isBoss
                          ? 'bg-red-500/15 text-red-700 font-bold'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {rightTag}
                    </span>
                    <span className="font-code text-[10px] text-outline tabular-nums mt-0.5">
                      {rightSub}
                    </span>
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
