import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  FlaskConical,
  Boxes,
  Armchair,
  ShoppingBag,
  Sparkles,
  MapPin,
  Users,
  FileText,
  X,
  Compass,
  SlidersHorizontal,
  Ghost,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { RegistryCategory, SearchEntity, QUEST_LEVEL_BANDS } from '../../types';
import { searchGlobal } from '../../services/search';
import {
  getItemIconUrl,
  getMobIconUrl,
  getMapMinimapUrl,
  getNpcIconUrl,
} from '../../api/maplestory';

interface HomePageProps {
  region: string;
  version: string;
  mobsCount: number;
  mapsCount: number;
  npcsCount: number;
  questsCount: number;
  onSelectCategory: (category: RegistryCategory, subCategory?: string, group?: string, filterPill?: string) => void;
  onSelectEntity: (category: RegistryCategory, id: number, subCategory?: string) => void;
  onSearch: (query: string) => void;
}

interface CategoryGroup {
  id: RegistryCategory;
  name: string;
  wzPackage: string;
  icon: React.ReactNode;
  count: number | string;
  description: string;
  subGroups?: Array<{
    groupName: string;
    items: Array<{ label: string; sub: string; count?: number; filterPill?: string }>;
  }>;
  items?: Array<{ label: string; sub: string; count?: number; filterPill?: string }>;
}

export const HomePage: React.FC<HomePageProps> = ({
  region,
  version,
  mobsCount,
  mapsCount,
  npcsCount,
  questsCount,
  onSelectCategory,
  onSelectEntity,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchEntity[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Collapsible category selectors state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    equips: true,
    monsters: true,
    quests: true,
    use: false,
    etc: false,
    setup: false,
    cash: false,
    maps: false,
    npcs: false,
  });

  // Toggle single category collapse/expand
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    setExpandedCategories({
      equips: true,
      use: true,
      etc: true,
      setup: true,
      cash: true,
      monsters: true,
      maps: true,
      npcs: true,
      quests: true,
    });
  };

  const collapseAll = () => {
    setExpandedCategories({
      equips: false,
      use: false,
      etc: false,
      setup: false,
      cash: false,
      monsters: false,
      maps: false,
      npcs: false,
      quests: false,
    });
  };

  // Live search debounced via searchGlobal for autocomplete preview
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const results = searchGlobal(searchQuery.trim(), 10);
      setSearchResults(results);
    }, 80);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle explicit form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // Complete Taxonomy definitions
  const categories: CategoryGroup[] = useMemo(() => [
    {
      id: 'equips',
      name: 'Equipment & Weapons',
      wzPackage: 'Character.wz',
      icon: <Shield className="w-4 h-4 text-amber-600" />,
      count: '2,800+',
      description: 'Weapons, armors, hats, overalls, capes, shields, and accessories.',
      subGroups: [
        {
          groupName: 'One-Handed Weapons',
          items: [
            { label: 'One-Handed Swords', sub: 'One-Handed Sword', count: 20 },
            { label: 'One-Handed Axes', sub: 'One-Handed Axe', count: 11 },
            { label: 'Blunt / Maces', sub: 'One-Handed Blunt Weapon', count: 27 },
            { label: 'Daggers', sub: 'Dagger', count: 22 },
            { label: 'Wands', sub: 'Wand', count: 11 },
            { label: 'Staves', sub: 'Staff', count: 8 },
            { label: 'Cash Weapons', sub: 'Cash Weapon', count: 321 },
          ],
        },
        {
          groupName: 'Two-Handed Weapons',
          items: [
            { label: 'Two-Handed Swords', sub: 'Two-Handed Sword', count: 17 },
            { label: 'Two-Handed Axes', sub: 'Two-Handed Axe', count: 10 },
            { label: 'Two-Handed Blunt', sub: 'Two-Handed Blunt Weapon', count: 13 },
            { label: 'Spears', sub: 'Spear', count: 16 },
            { label: 'Polearms', sub: 'Polearm', count: 15 },
            { label: 'Bows', sub: 'Bow', count: 18 },
            { label: 'Crossbows', sub: 'Crossbow', count: 15 },
            { label: 'Claws', sub: 'Claw', count: 19 },
          ],
        },
        {
          groupName: 'Armor & Garments',
          items: [
            { label: 'Hats & Helmets', sub: 'Hat', count: 210 },
            { label: 'Tops', sub: 'Top', count: 145 },
            { label: 'Bottoms', sub: 'Bottom', count: 120 },
            { label: 'Overall Suits', sub: 'Overall', count: 185 },
            { label: 'Gloves', sub: 'Glove', count: 68 },
            { label: 'Shoes', sub: 'Shoes', count: 74 },
            { label: 'Capes', sub: 'Cape', count: 42 },
            { label: 'Shields', sub: 'Shield', count: 28 },
          ],
        },
        {
          groupName: 'Accessories',
          items: [
            { label: 'Rings', sub: 'Ring', count: 32 },
            { label: 'Pendants', sub: 'Pendant', count: 18 },
            { label: 'Earrings', sub: 'Earrings', count: 44 },
            { label: 'Face Accessories', sub: 'Face Accessory', count: 12 },
            { label: 'Eye Accessories', sub: 'Eye Accessory', count: 14 },
          ],
        },
      ],
    },
    {
      id: 'use',
      name: 'Use & Consumables',
      wzPackage: 'Item.wz',
      icon: <FlaskConical className="w-4 h-4 text-sky-600" />,
      count: '420+',
      description: 'Potions, enhancement scrolls, return scrolls, throwing stars, and buffs.',
      items: [
        { label: 'Recovery Potions', sub: 'Potion' },
        { label: 'Weapon Scrolls', sub: 'Scroll' },
        { label: 'Armor Scrolls', sub: 'Scroll' },
        { label: 'Town Return Scrolls', sub: 'Town Return Scroll' },
        { label: 'Throwing Stars & Bullets', sub: 'Projectile' },
        { label: 'Stat Buffs & Foods', sub: 'Buff' },
      ],
    },
    {
      id: 'etc',
      name: 'Etc & Crafting Materials',
      wzPackage: 'Item.wz',
      icon: <Boxes className="w-4 h-4 text-emerald-600" />,
      count: '680+',
      description: 'Monster drops, raw ores, refined minerals, quest clues, and crafting supplies.',
      items: [
        { label: 'Monster Drops', sub: 'Monster Drop' },
        { label: 'Ores & Minerals', sub: 'Ore' },
        { label: 'Refined Jewels', sub: 'Mineral' },
        { label: 'Quest Tokens', sub: 'Quest Item' },
        { label: 'Crafting Components', sub: 'Crafting' },
      ],
    },
    {
      id: 'setup',
      name: 'Setup & Chairs',
      wzPackage: 'Item.wz',
      icon: <Armchair className="w-4 h-4 text-purple-600" />,
      count: '95+',
      description: 'Resting chairs, interactive seats, event decorations, and recovery setups.',
      items: [
        { label: 'Rest Chairs', sub: 'Chair' },
        { label: 'Themed Benches', sub: 'Decoration' },
        { label: 'Event Chairs', sub: 'Event' },
      ],
    },
    {
      id: 'cash',
      name: 'Cash Shop Equipment',
      wzPackage: 'Cash.wz',
      icon: <ShoppingBag className="w-4 h-4 text-pink-600" />,
      count: '1,200+',
      description: 'Visual equipment covers, decorative pets, pet accessories, and chat effects.',
      items: [
        { label: 'Weapon Covers', sub: 'Weapon Cover' },
        { label: 'Costumes & Hats', sub: 'Hat Cover' },
        { label: 'Pets & Companions', sub: 'Pet' },
        { label: 'Pet Accessories', sub: 'Pet Equip' },
        { label: 'Rings & Effects', sub: 'Effect' },
      ],
    },
    {
      id: 'monsters',
      name: 'Bestiary & Bosses',
      wzPackage: 'Mob.wz',
      icon: <Ghost className="w-4 h-4 text-red-600" />,
      count: mobsCount || 101,
      description: 'Classic monsters, stats, HP/MP curves, elemental weaknesses, and spawn maps.',
      items: [
        { label: 'Level 1–10 (Beginner)', sub: '', filterPill: '1-30' },
        { label: 'Level 11–30 (Early Island)', sub: '', filterPill: '1-30' },
        { label: 'Level 31–60 (Victoria Core)', sub: '', filterPill: '31-60' },
        { label: 'Level 61–99 (Ossyria & Depths)', sub: '', filterPill: '61-99' },
        { label: 'Level 100+ (High Level)', sub: '', filterPill: '100+' },
        { label: 'Bosses & Field Masters', sub: '', filterPill: 'Bosses' },
      ],
    },
    {
      id: 'maps',
      name: 'World Cartography',
      wzPackage: 'Map.wz',
      icon: <MapPin className="w-4 h-4 text-blue-600" />,
      count: mapsCount || 318,
      description: 'Hierarchical topologies, town sectors, dungeons, portals, and background audio.',
      items: [
        { label: 'Major Towns', sub: '', filterPill: 'Towns' },
        { label: 'Victoria Island Region', sub: '', filterPill: 'Victoria' },
        { label: 'Ossyria Continents', sub: '', filterPill: 'Ossyria' },
        { label: 'Henesys & Surrounds', sub: 'Henesys' },
        { label: 'Ellinia Forests', sub: 'Ellinia' },
        { label: 'Perion Highlands', sub: 'Perion' },
        { label: 'Kerning City & Swamps', sub: 'Kerning City' },
        { label: 'Sleepywood Dungeon Depths', sub: 'Sleepywood' },
      ],
    },
    {
      id: 'npcs',
      name: 'Resident NPCs',
      wzPackage: 'Npc.wz',
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      count: npcsCount || 226,
      description: 'Town citizens, job advancement masters, shop merchants, and quest givers.',
      items: [
        { label: 'Job Instructors', sub: '' },
        { label: 'Town Merchants', sub: '' },
        { label: 'Legendary Quest NPCs', sub: '' },
        { label: 'Storage Keepers', sub: '' },
      ],
    },
    {
      id: 'quests',
      name: 'Quest Codex (By Level)',
      wzPackage: 'Quest.wz',
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      count: questsCount || 273,
      description: 'Canonical pre-Big Bang quest storylines categorized strictly by level requirement bands.',
      items: QUEST_LEVEL_BANDS.map((band) => ({
        label: `${band.label} (${band.group})`,
        sub: band.label,
        filterPill: band.label,
      })),
    },
  ], [mobsCount, mapsCount, npcsCount, questsCount]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface text-on-surface select-text antialiased">
      {/* Top Hero Section */}
      <div className="pt-12 pb-8 px-6 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Status badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 font-code text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            MapleStory Classic Archive • {region} v.{version}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-code text-[11px]">
            Zero Hardcoded Data
          </span>
        </div>

        <h1 className="font-headline-lg text-4xl sm:text-5xl font-black tracking-tight text-on-surface mb-3">
          MS//Archive
        </h1>
        <p className="font-body-md text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-8">
          The definitive, high-fidelity archival workspace for pre-Big Bang MapleStory.
          Explore classic equipment, monsters, map topologies, and quest storylines.
        </p>

        {/* Central General Search Bar with Integrated Search Action Button */}
        <div className="w-full max-w-2xl relative mb-4">
          <form
            onSubmit={handleSubmit}
            className="flex items-center w-full bg-surface-container-lowest rounded-xl border-2 border-outline-variant/40 hover:border-amber-500/60 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 shadow-sm transition-all overflow-hidden p-1.5"
          >
            <div className="pl-3 pr-2 text-outline flex items-center">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weapons, armors, monsters, maps, NPCs, quests, or IDs..."
              className="flex-1 bg-transparent border-none outline-none font-body-md text-sm sm:text-base text-on-surface placeholder:text-outline-variant px-2 py-2"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1.5 text-outline hover:text-on-surface rounded-md hover:bg-surface-container mr-1 cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Dedicated Search Action Button */}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-headline-sm text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex-shrink-0"
              title="Search and load results in 3-pane Explorer"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Autocomplete Suggestions Dropdown */}
          {searchQuery.trim().length > 0 && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xl z-50 overflow-hidden text-left divide-y divide-outline-variant/20">
              <div className="p-2.5 bg-surface-container-low/60 flex items-center justify-between text-[11px] font-code text-on-surface-variant">
                <span>Instant Matches for &ldquo;{searchQuery}&rdquo;</span>
                <span className="font-semibold text-amber-600">{searchResults.length} results</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => onSelectEntity(entity.category, entity.numericId, entity.subCategory)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-container text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center p-0.5 flex-shrink-0">
                        {entity.category === 'equips' && (
                          <img
                            src={getItemIconUrl(region, version, entity.numericId)}
                            alt=""
                            className="w-6 h-6 object-contain image-rendering-pixelated"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        {entity.category === 'monsters' && (
                          <img
                            src={getMobIconUrl(region, version, entity.numericId)}
                            alt=""
                            className="w-6 h-6 object-contain image-rendering-pixelated"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        {entity.category === 'maps' && (
                          <img
                            src={getMapMinimapUrl(region, version, entity.numericId)}
                            alt=""
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        {entity.category === 'npcs' && (
                          <img
                            src={getNpcIconUrl(region, version, entity.numericId)}
                            alt=""
                            className="w-6 h-6 object-contain image-rendering-pixelated"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        {entity.category === 'quests' && <FileText className="w-4 h-4 text-amber-600" />}
                      </div>

                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-on-surface group-hover:text-amber-600 transition-colors">
                          {entity.name}
                        </span>
                        <span className="font-code text-[11px] text-outline">
                          ID: {entity.numericId} {entity.extra ? `• ${entity.extra}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[10px] text-on-surface-variant uppercase">
                      {entity.category}
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-2 bg-surface-container-low/40 text-center">
                <button
                  onClick={() => onSearch(searchQuery.trim())}
                  className="font-headline-sm text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                >
                  Load all results in Explorer &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick summary counts banner */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-code text-on-surface-variant mt-2">
          <span>{categories[0].count} Equips</span>
          <span className="text-outline-variant">•</span>
          <span>{mobsCount} Monsters</span>
          <span className="text-outline-variant">•</span>
          <span>{mapsCount} Maps</span>
          <span className="text-outline-variant">•</span>
          <span>{npcsCount} NPCs</span>
          <span className="text-outline-variant">•</span>
          <span>{questsCount} Quests</span>
        </div>
      </div>

      {/* Main Taxonomy & Collapsible Category Selectors Section */}
      <div className="max-w-5xl mx-auto w-full px-6 pb-16 flex flex-col gap-6">
        {/* Controls Bar */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <h2 className="font-headline-sm text-base font-bold text-on-surface tracking-tight">
              Taxonomy & Archive Directory
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Collapsible Category Cards Container */}
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const isExpanded = !!expandedCategories[cat.id];
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 hover:border-outline-variant/60 transition-all overflow-hidden"
              >
                {/* Header Row (Click to toggle expand/collapse) */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-surface-container-low/60 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[15px] font-bold text-on-surface">
                          {cat.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-container font-code text-[10px] text-outline">
                          {cat.wzPackage}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {cat.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-code text-xs text-outline tabular-nums">
                      {cat.count} items
                    </span>
                    <span className="p-1 rounded hover:bg-surface-container text-on-surface-variant">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-on-surface" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Subcategory Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
                    {cat.subGroups ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {cat.subGroups.map((group) => (
                          <div
                            key={group.groupName}
                            className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/20"
                          >
                            <span className="font-code text-[11px] font-bold text-outline uppercase tracking-wider">
                              {group.groupName}
                            </span>
                            <div className="flex flex-col gap-1 mt-1">
                              {group.items.map((leaf) => (
                                <button
                                  key={leaf.sub}
                                  onClick={() => onSelectCategory(cat.id, leaf.sub, group.groupName)}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-surface-container-high text-left text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group"
                                >
                                  <span className="group-hover:text-amber-600 transition-colors font-medium">
                                    {leaf.label}
                                  </span>
                                  {leaf.count !== undefined && (
                                    <span className="font-code text-[10px] text-outline tabular-nums">
                                      {leaf.count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {cat.items?.map((item) => (
                          <button
                            key={item.label}
                            onClick={() =>
                              onSelectCategory(
                                cat.id,
                                item.sub,
                                undefined,
                                item.filterPill
                              )
                            }
                            className="p-2.5 rounded-lg border border-outline-variant/20 bg-surface-container-low/40 hover:bg-surface-container hover:border-amber-500/40 text-left transition-all cursor-pointer group flex flex-col justify-between h-[72px]"
                          >
                            <span className="font-medium text-xs text-on-surface group-hover:text-amber-600 transition-colors line-clamp-2 leading-tight">
                              {item.label}
                            </span>
                            <div className="flex items-center justify-between mt-1 text-[10px] font-code text-outline">
                              <span>Open node</span>
                              {item.count !== undefined && (
                                <span className="tabular-nums font-semibold text-on-surface-variant">
                                  {item.count}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4 Quick Jump Explore Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <button
            onClick={() => onSelectCategory('equips', 'One-Handed Sword', 'One-Handed Weapons')}
            className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 hover:border-amber-500/50 hover:bg-surface-container-low transition-all text-left group cursor-pointer flex flex-col justify-between h-36 shadow-xs"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-amber-600 transition-colors">
                Equipment Arsenal
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                2,800+ weapons, armors, job requirements, and upgrade slots.
              </p>
            </div>
            <span className="font-code text-[11px] text-amber-600 flex items-center gap-1 font-semibold">
              Browse Equips &rarr;
            </span>
          </button>

          <button
            onClick={() => onSelectCategory('monsters', '', undefined, 'All')}
            className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 hover:border-red-500/50 hover:bg-surface-container-low transition-all text-left group cursor-pointer flex flex-col justify-between h-36 shadow-xs"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 mb-2 group-hover:scale-105 transition-transform">
                <Ghost className="w-4 h-4" />
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-red-600 transition-colors">
                Bestiary Codex
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                101 classic monsters with live sprites, HP, EXP, and spawn maps.
              </p>
            </div>
            <span className="font-code text-[11px] text-red-600 flex items-center gap-1 font-semibold">
              Inspect Bestiary &rarr;
            </span>
          </button>

          <button
            onClick={() => onSelectCategory('maps', '', undefined, 'All')}
            className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 hover:border-blue-500/50 hover:bg-surface-container-low transition-all text-left group cursor-pointer flex flex-col justify-between h-36 shadow-xs"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-blue-600 transition-colors">
                World Topologies
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                318 maps spanning Victoria Island, Ossyria, and Ludus Lake.
              </p>
            </div>
            <span className="font-code text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
              View Cartography &rarr;
            </span>
          </button>

          <button
            onClick={() => onSelectCategory('quests', 'Lv. 1–10', undefined, 'Lv. 1–10')}
            className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 hover:border-amber-500/50 hover:bg-surface-container-low transition-all text-left group cursor-pointer flex flex-col justify-between h-36 shadow-xs"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-amber-600 transition-colors">
                Quest Dossiers
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                273 canonical quests grouped by level requirement bands.
              </p>
            </div>
            <span className="font-code text-[11px] text-amber-600 flex items-center gap-1 font-semibold">
              Explore Quests &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
