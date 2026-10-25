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
  ArrowRight,
  Compass,
  SlidersHorizontal,
  FolderOpen,
  Folder,
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
  onSelectCategory: (category: RegistryCategory, subCategory: string, group?: string, filterPill?: string) => void;
  onSelectEntity: (category: RegistryCategory, id: number, subCategory?: string) => void;
  onOpenWorkspace: () => void;
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
  onOpenWorkspace,
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

  // Live search debounced via searchGlobal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const results = searchGlobal(searchQuery.trim(), 12);
      setSearchResults(results);
    }, 80);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
            { label: 'Helmets & Hats', sub: 'Hat', count: 212 },
            { label: 'Tops & Shirts', sub: 'Top', count: 88 },
            { label: 'Bottoms & Pants', sub: 'Bottom', count: 64 },
            { label: 'Overalls & Robes', sub: 'Overall', count: 134 },
            { label: 'Shoes & Boots', sub: 'Shoe', count: 118 },
            { label: 'Gloves & Gauntlets', sub: 'Glove', count: 72 },
            { label: 'Capes & Cloaks', sub: 'Cape', count: 45 },
            { label: 'Shields', sub: 'Shield', count: 32 },
          ],
        },
        {
          groupName: 'Accessories',
          items: [
            { label: 'Rings', sub: 'Ring', count: 18 },
            { label: 'Earrings', sub: 'Earring', count: 42 },
            { label: 'Pendants', sub: 'Pendant', count: 12 },
            { label: 'Belts', sub: 'Belt', count: 8 },
          ],
        },
      ],
    },
    {
      id: 'use',
      name: 'Use & Consumables',
      wzPackage: 'Item.wz',
      icon: <FlaskConical className="w-4 h-4 text-sky-600" />,
      count: '160+',
      description: 'Potions, weapon scrolls, armor scrolls, projectiles, and return scrolls.',
      items: [
        { label: 'Potions & Recovery', sub: 'Potion', count: 24 },
        { label: 'Weapon Enhancement Scrolls', sub: 'Weapon Scroll', count: 48 },
        { label: 'Armor Enhancement Scrolls', sub: 'Armor Scroll', count: 52 },
        { label: 'Clean Slate & Chaos Scrolls', sub: 'Special Scroll', count: 14 },
        { label: 'Thrown Stars & Subis', sub: 'Thrown', count: 11 },
        { label: 'Bow Arrows', sub: 'Arrow', count: 4 },
        { label: 'Crossbow Bolts', sub: 'Crossbow Bolt', count: 4 },
      ],
    },
    {
      id: 'etc',
      name: 'Etc & Materials',
      wzPackage: 'Item.wz',
      icon: <Boxes className="w-4 h-4 text-amber-600" />,
      count: '380+',
      description: 'Monster drops, mineral ores, refined gems, quest tokens, and maker catalysts.',
      items: [
        { label: 'Monster Drops', sub: 'Monster Drop', count: 202 },
        { label: 'Quest Tokens & Items', sub: 'Quest Item', count: 137 },
        { label: 'Mineral Ores', sub: 'Mineral Ore', count: 15 },
        { label: 'Rare Ores & Gold', sub: 'Rare Ore', count: 9 },
        { label: 'Refined Gems & Jewels', sub: 'Gem', count: 10 },
        { label: 'Crafting / Maker System', sub: 'Maker', count: 4 },
        { label: 'Omok & Minigames', sub: 'Minigame', count: 7 },
      ],
    },
    {
      id: 'setup',
      name: 'Setup & Chairs',
      wzPackage: 'Item.wz',
      icon: <Armchair className="w-4 h-4 text-purple-600" />,
      count: '220+',
      description: 'Decorative chairs, room furniture, event novelties, and crafting stations.',
      items: [
        { label: 'Decorative Chairs', sub: 'Chair', count: 66 },
        { label: 'Room Decorations', sub: 'Decoration', count: 87 },
        { label: 'Housing Furniture', sub: 'Furniture', count: 52 },
        { label: 'Event Novelties', sub: 'Event Item', count: 12 },
        { label: 'Storage Units', sub: 'Storage', count: 4 },
        { label: 'Crafting Stations', sub: 'Crafting Station', count: 6 },
      ],
    },
    {
      id: 'cash',
      name: 'Cash Shop Novelties',
      wzPackage: 'Cash.wz',
      icon: <ShoppingBag className="w-4 h-4 text-rose-600" />,
      count: '100+',
      description: 'Pets, visual rings, weather broadcasts, facial expressions, and store permits.',
      items: [
        { label: 'Pets & Companions', sub: 'Pet', count: 35 },
        { label: 'Visual Aura Effects', sub: 'Effect', count: 9 },
        { label: 'Facial Expressions', sub: 'Facial Expression', count: 15 },
        { label: 'Weather Broadcasts', sub: 'Weather Effect', count: 16 },
        { label: 'Super Megaphones & Messengers', sub: 'Messenger', count: 5 },
        { label: 'Hired Merchants', sub: 'Hired Merchant', count: 5 },
        { label: 'Store Permits', sub: 'Store Permit', count: 6 },
      ],
    },
    {
      id: 'monsters',
      name: 'Monsters & Bosses',
      wzPackage: 'Mob.wz',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      count: mobsCount || 101,
      description: 'Complete bestiary with animated sprites, HP/MP pools, elemental affinities, and spawn maps.',
      items: [
        { label: 'All Monsters (Bestiary)', sub: '', filterPill: 'All', count: mobsCount || 101 },
        { label: 'Level 1 - 30 (Beginner)', sub: '', filterPill: '1-30', count: 35 },
        { label: 'Level 31 - 60 (Intermediate)', sub: '', filterPill: '31-60', count: 28 },
        { label: 'Level 61 - 99 (Advanced)', sub: '', filterPill: '61-99', count: 22 },
        { label: 'Level 100+ (Mastery)', sub: '', filterPill: '100+', count: 12 },
        { label: 'Boss Monsters (Balrog, Zakum, etc.)', sub: '', filterPill: 'Bosses', count: 4 },
      ],
    },
    {
      id: 'maps',
      name: 'Map Topologies & Minimaps',
      wzPackage: 'Map.wz',
      icon: <MapPin className="w-4 h-4 text-sky-600" />,
      count: mapsCount || 318,
      description: 'World maps, town hubs, dungeon footholds, ambient BGM tracks, and monster spawns.',
      items: [
        { label: 'All Maps Registry', sub: '', filterPill: 'All', count: mapsCount || 318 },
        { label: 'Towns & Havens', sub: '', filterPill: 'Towns', count: 18 },
        { label: 'Victoria Island Region', sub: '', filterPill: 'Victoria', count: 180 },
        { label: 'Ossyria & El Nath Snowfield', sub: '', filterPill: 'Ossyria', count: 84 },
      ],
    },
    {
      id: 'npcs',
      name: 'NPCs & Dialogue Scripts',
      wzPackage: 'Npc.wz',
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      count: npcsCount || 226,
      description: 'Town residents, job instructors, shop merchants, and quest dialogue transcripts.',
      items: [
        { label: 'All Resident NPCs', sub: '', count: npcsCount || 226 },
        { label: 'Merchant Shops', sub: '', count: 42 },
        { label: 'Job Instructors', sub: '', count: 18 },
        { label: 'Quest Dispatchers', sub: '', count: 64 },
      ],
    },
    {
      id: 'quests',
      name: 'Quest Data & Level Bands',
      wzPackage: 'Quest.wz',
      icon: <FileText className="w-4 h-4 text-purple-600" />,
      count: questsCount || 316,
      description: 'Categorized strictly by player level requirements with EXP rewards and required items.',
      items: [
        { label: 'All Quests (316 quests)', sub: '', count: questsCount || 316 },
        ...QUEST_LEVEL_BANDS.map((b) => ({
          label: `${b.label} (${b.group} Range)`,
          sub: b.id,
          count: b.count,
          filterPill: b.id,
        })),
      ],
    },
  ], [mobsCount, mapsCount, npcsCount, questsCount]);

  const quickSearchPills = [
    'Zakum',
    'Red Katana',
    'Jr. Boogie',
    'Ilbi',
    'Work Glove',
    'Henesys',
    'Horny Mushroom',
    'Pan Lid',
    'Maple Sword',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface text-on-surface select-text">
      {/* Hero Section */}
      <div className="border-b border-outline-variant/20 bg-surface-container-lowest/60 py-12 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle Archival Grid Background Accent */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-3xl w-full flex flex-col items-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant font-code text-[11px] mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>MapleStory Classic Archive</span>
            <span className="text-outline">•</span>
            <span className="font-semibold text-on-surface">{region} v.{version}</span>
          </div>

          <h1 className="font-headline-lg text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Archive Search & Taxonomy Hub
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-xl text-[14px] leading-relaxed">
            Instant search and hierarchical directory for MapleStory Classic.
            Explore over 4,000 live equipment sprites, monster combat vitals, map footholds, and level-banded quests.
          </p>

          {/* General Search Input Field */}
          <div className="w-full mt-6 relative">
            <div className="relative flex items-center bg-surface-container-low focus-within:bg-surface-container-lowest rounded-xl border border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 shadow-sm transition-all">
              <Search className="w-5 h-5 text-on-surface-variant ml-4 mr-2 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search weapons, equips, mobs, maps, NPCs, or quests by name or ID..."
                className="w-full py-3.5 pr-24 bg-transparent font-body-md text-[14px] text-on-surface placeholder:text-outline outline-none"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface-variant border border-outline-variant/30 shadow-xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Live Search Instant Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-2xl z-40 overflow-hidden divide-y divide-outline-variant/15 text-left max-h-[380px] overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant font-body-sm">
                    <p className="font-medium text-body-sm">No entities found for "{searchQuery}"</p>
                    <span className="text-[11px] text-outline font-code mt-0.5 block">
                      Try searching with exact numeric ID or a shorter keyword
                    </span>
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={`${item.category}_${item.numericId}`}
                      onClick={() => onSelectEntity(item.category, item.numericId, item.subCategory)}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail icon */}
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/20 overflow-hidden">
                          {item.category === 'monsters' ? (
                            <img
                              src={getMobIconUrl(region, version, item.numericId)}
                              alt=""
                              className="max-w-[28px] max-h-[28px] object-contain"
                              style={{ imageRendering: 'pixelated' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : item.category === 'maps' ? (
                            <img
                              src={getMapMinimapUrl(region, version, item.numericId)}
                              alt=""
                              className="max-w-[28px] max-h-[28px] object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : item.category === 'npcs' ? (
                            <img
                              src={getNpcIconUrl(region, version, item.numericId)}
                              alt=""
                              className="max-w-[28px] max-h-[28px] object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <img
                              src={getItemIconUrl(region, version, item.numericId)}
                              alt=""
                              className="max-w-[28px] max-h-[28px] object-contain"
                              style={{ imageRendering: 'pixelated' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-body-sm font-medium text-on-surface group-hover:text-amber-600 transition-colors truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-outline font-code truncate">
                            {item.extra || item.subCategory || `ID #${item.numericId}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-code text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium uppercase">
                          {item.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-outline opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
            <span className="text-[11px] font-code text-outline mr-1">Popular:</span>
            {quickSearchPills.map((pill) => (
              <button
                key={pill}
                onClick={() => setSearchQuery(pill)}
                className="px-2 py-0.5 rounded-md bg-surface-container/70 hover:bg-surface-container text-on-surface-variant text-[11px] font-code border border-outline-variant/20 transition-colors cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Open Full 3-Pane Workspace Button */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-on-surface text-surface font-headline-sm text-[12.5px] hover:bg-primary transition-all shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Launch 3-Pane Explorer Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible / Expandable Category Selectors Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Section Control Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 mb-6 gap-3">
          <div>
            <h2 className="font-headline-md text-lg font-semibold text-on-surface flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              Archive Taxonomy Selectors
            </h2>
            <p className="text-[12px] font-body-sm text-on-surface-variant mt-0.5">
              Click any category or subcategory node below to open the live 3-pane inspector.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-code text-[11px] border border-outline-variant/30 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3 h-3 text-on-surface-variant" />
              <span>Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-code text-[11px] border border-outline-variant/30 transition-colors cursor-pointer"
            >
              <Folder className="w-3 h-3 text-on-surface-variant" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Collapsible Category Cards Grid */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = !!expandedCategories[cat.id];
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/70 overflow-hidden transition-all shadow-xs"
              >
                {/* Header (Click to Expand / Collapse) */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="px-4 py-3 flex items-center justify-between bg-surface-container-low/40 hover:bg-surface-container-low cursor-pointer transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex-shrink-0">
                      {cat.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[14px] font-semibold text-on-surface">
                          {cat.name}
                        </span>
                        <span className="font-code text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                          {cat.wzPackage}
                        </span>
                      </div>
                      <span className="text-[12px] text-on-surface-variant truncate font-body-sm mt-0.5">
                        {cat.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-code text-[11px] text-outline tabular-nums">
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

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest animate-in fade-in-50 duration-150">
                    {cat.subGroups ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cat.subGroups.map((group) => (
                          <div
                            key={group.groupName}
                            className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/20"
                          >
                            <span className="font-headline-sm text-[12px] font-bold text-on-surface uppercase tracking-wider text-outline">
                              {group.groupName}
                            </span>
                            <div className="flex flex-col gap-1 mt-1">
                              {group.items.map((leaf) => (
                                <button
                                  key={leaf.sub}
                                  onClick={() => onSelectCategory(cat.id, leaf.sub, group.groupName)}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-surface-container-high text-left text-body-sm text-[12px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group"
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
                            <span className="font-medium text-[12px] text-on-surface group-hover:text-amber-600 transition-colors line-clamp-2 leading-tight">
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
      </div>
    </div>
  );
};
