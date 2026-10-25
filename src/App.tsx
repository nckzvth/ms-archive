import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  fetchWzVersions,
  fetchCategories,
  fetchItems,
  fetchItemDetail,
  fetchMobs,
  fetchMobDetail,
  fetchMaps,
  fetchMapDetail,
  fetchNpcs,
  fetchNpcDetail,
  fetchQuests,
  fetchQuestDetail,
} from './api/maplestory';
import { indexEntities } from './services/search';
import { useRegistryState } from './hooks/useRegistryState';
import { Header } from './components/layout/Header';
import { SidebarTree } from './components/layout/SidebarTree';
import { StreamFeed, FeedEntity } from './components/layout/StreamFeed';
import { InspectorVitrine } from './components/layout/InspectorVitrine';
import { HomePage } from './components/home/HomePage';
import { CommandPalette } from './components/common/CommandPalette';
import { BookmarksDrawer } from './components/common/BookmarksDrawer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  RegistryCategory,
  SearchEntity,
  BookmarkItem,
  isQuestInBand,
  getQuestBandInfo,
} from './types';

export const App: React.FC = () => {
  const { state, updateState, bookmarks, toggleBookmark, isBookmarked } = useRegistryState();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch WZ Versions (defaults strictly to MCW 1)
  const { data: wzVersions = [] } = useQuery({
    queryKey: ['wzVersions'],
    queryFn: fetchWzVersions,
    staleTime: 1000 * 60 * 60,
  });

  // 2. Fetch Category Tree
  const { data: categoryTree = null } = useQuery({
    queryKey: ['categoryTree', state.region, state.version],
    queryFn: () => fetchCategories(state.region, state.version),
    staleTime: 1000 * 60 * 60,
  });

  // 3. Fetch Items for Active Category & SubCategory
  const isItemCategory =
    state.category === 'equips' ||
    state.category === 'use' ||
    state.category === 'etc' ||
    state.category === 'setup' ||
    state.category === 'cash' ||
    state.category === 'all';

  const overallFilterMap: Record<string, string> = {
    all: 'Equip',
    equips: 'Equip',
    use: 'Use',
    etc: 'Etc',
    setup: 'Setup',
    cash: 'Cash',
  };

  // Determine effective subcategory to avoid massive unfiltered downloads
  const effectiveSubCategory = useMemo(() => {
    if (state.subCategory) return state.subCategory;
    if (state.category === 'equips' || state.category === 'all') return 'One-Handed Sword';
    if (state.category === 'use') return 'Potion';
    if (state.category === 'etc') return 'Monster Drop';
    if (state.category === 'setup') return 'Chair';
    if (state.category === 'cash') return 'Pet';
    return '';
  }, [state.category, state.subCategory]);

  const { data: rawItems = [], isLoading: itemsLoading, isFetching: itemsFetching } = useQuery({
    queryKey: ['items', state.region, state.version, state.category, effectiveSubCategory],
    queryFn: () => {
      return fetchItems(state.region, state.version, {
        overallCategoryFilter: overallFilterMap[state.category] || 'Equip',
        subCategoryFilter: effectiveSubCategory || undefined,
      });
    },
    enabled: isItemCategory,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  // 4. Fetch Mobs
  const { data: rawMobs = [], isLoading: mobsLoading, isFetching: mobsFetching } = useQuery({
    queryKey: ['mobs', state.region, state.version],
    queryFn: () => fetchMobs(state.region, state.version),
    enabled: true, // Always prefetch so world search & count is instant
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  });

  // 5. Fetch Maps
  const { data: rawMaps = [], isLoading: mapsLoading, isFetching: mapsFetching } = useQuery({
    queryKey: ['maps', state.region, state.version],
    queryFn: () => fetchMaps(state.region, state.version),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  });

  // 6. Fetch NPCs
  const { data: rawNpcs = [], isLoading: npcsLoading, isFetching: npcsFetching } = useQuery({
    queryKey: ['npcs', state.region, state.version],
    queryFn: () => fetchNpcs(state.region, state.version),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  });

  // 7. Fetch Quests
  const { data: rawQuests = [], isLoading: questsLoading, isFetching: questsFetching } = useQuery({
    queryKey: ['quests', state.region, state.version],
    queryFn: () => fetchQuests(state.region, state.version),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  });

  // 8. Fetch Enhancement Scrolls for the Equipment Scrolls Tab
  const { data: rawScrolls = [] } = useQuery({
    queryKey: ['scrolls', state.region, state.version],
    queryFn: async () => {
      const p1 = fetchItems(state.region, state.version, { overallCategoryFilter: 'Use', subCategoryFilter: 'One-Handed Sword' });
      const p2 = fetchItems(state.region, state.version, { overallCategoryFilter: 'Use', subCategoryFilter: 'Helmet' });
      const p3 = fetchItems(state.region, state.version, { overallCategoryFilter: 'Use', subCategoryFilter: 'Gloves' });
      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
      return [...r1, ...r2, ...r3];
    },
    enabled: state.category === 'equips',
    staleTime: 1000 * 60 * 60,
  });

  // Non-blocking asynchronous indexing for MiniSearch via requestIdleCallback
  const indexTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (indexTimeoutRef.current) clearTimeout(indexTimeoutRef.current);

    indexTimeoutRef.current = setTimeout(() => {
      const scheduleIdle =
        typeof window !== 'undefined' && 'requestIdleCallback' in window
          ? window.requestIdleCallback
          : (cb: () => void) => setTimeout(cb, 10);

      scheduleIdle(() => {
        const entitiesToIndex: SearchEntity[] = [];

        if (rawItems.length > 0) {
          rawItems.forEach((i) => {
            if (i && i.id) {
              entitiesToIndex.push({
                id: `${state.category}_${i.id}`,
                numericId: i.id,
                name: i.name || `Item #${i.id}`,
                category: state.category,
                subCategory: i.typeInfo?.subCategory,
                extra: `Level ${i.requiredLevel || 0}`,
              });
            }
          });
        }

        if (rawMobs.length > 0) {
          rawMobs.forEach((m) => {
            if (m && m.id) {
              entitiesToIndex.push({
                id: `monsters_${m.id}`,
                numericId: m.id,
                name: m.name || `Monster #${m.id}`,
                category: 'monsters',
                extra: `Level ${m.level || 0} ${m.isBoss ? 'Boss' : ''}`,
              });
            }
          });
        }

        if (rawMaps.length > 0) {
          rawMaps.forEach((mp) => {
            if (mp && mp.id) {
              entitiesToIndex.push({
                id: `maps_${mp.id}`,
                numericId: mp.id,
                name: mp.name || `Map #${mp.id}`,
                category: 'maps',
                subCategory: mp.streetName,
              });
            }
          });
        }

        if (rawNpcs.length > 0) {
          rawNpcs.forEach((n) => {
            if (n && n.id) {
              entitiesToIndex.push({
                id: `npcs_${n.id}`,
                numericId: n.id,
                name: n.name || `NPC #${n.id}`,
                category: 'npcs',
              });
            }
          });
        }

        if (rawQuests.length > 0) {
          rawQuests.forEach((q) => {
            if (q && q.id) {
              const lvl = q.minLevel ?? 1;
              const band = getQuestBandInfo(lvl);
              entitiesToIndex.push({
                id: `quests_${q.id}`,
                numericId: q.id,
                name: q.name || `Quest #${q.id}`,
                category: 'quests',
                subCategory: band.label,
                extra: `Req. Level ${lvl} (${band.group})`,
              });
            }
          });
        }

        if (entitiesToIndex.length > 0) {
          indexEntities(entitiesToIndex);
        }
      });
    }, 150);

    return () => {
      if (indexTimeoutRef.current) clearTimeout(indexTimeoutRef.current);
    };
  }, [rawItems, rawMobs, rawMaps, rawNpcs, rawQuests, state.category]);

  // Transform active items for StreamFeed safely with strict deduplication
  const feedItems: FeedEntity[] = useMemo(() => {
    if (state.category === 'all') {
      const allList: FeedEntity[] = [];
      const seenIds = new Set<string>();

      const addEntity = (entity: FeedEntity) => {
        const key = `${entity.entityType}_${entity.id}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allList.push(entity);
        }
      };

      if (Array.isArray(rawItems)) {
        rawItems.filter(Boolean).forEach((item) => addEntity({ ...item, entityType: 'item' as const }));
      }
      if (Array.isArray(rawMobs)) {
        rawMobs.filter(Boolean).forEach((mob) => addEntity({ ...mob, entityType: 'mob' as const }));
      }
      if (Array.isArray(rawMaps)) {
        rawMaps.filter(Boolean).forEach((map) => addEntity({ ...map, entityType: 'map' as const }));
      }
      if (Array.isArray(rawNpcs)) {
        rawNpcs.filter(Boolean).forEach((npc) => addEntity({ ...npc, entityType: 'npc' as const }));
      }
      if (Array.isArray(rawQuests)) {
        rawQuests.filter(Boolean).forEach((quest) => addEntity({ ...quest, entityType: 'quest' as const }));
      }
      return allList;
    }
    if (isItemCategory && Array.isArray(rawItems)) {
      const seen = new Set<number>();
      return rawItems
        .filter(Boolean)
        .filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .map((item) => ({ ...item, entityType: 'item' as const }));
    }
    if (state.category === 'monsters' && Array.isArray(rawMobs)) {
      const seen = new Set<number>();
      return rawMobs
        .filter(Boolean)
        .filter((mob) => {
          if (seen.has(mob.id)) return false;
          seen.add(mob.id);
          return true;
        })
        .map((mob) => ({ ...mob, entityType: 'mob' as const }));
    }
    if (state.category === 'maps' && Array.isArray(rawMaps)) {
      const seen = new Set<number>();
      return rawMaps
        .filter(Boolean)
        .filter((map) => {
          if (seen.has(map.id)) return false;
          seen.add(map.id);
          return true;
        })
        .map((map) => ({ ...map, entityType: 'map' as const }));
    }
    if (state.category === 'npcs' && Array.isArray(rawNpcs)) {
      const seen = new Set<number>();
      return rawNpcs
        .filter(Boolean)
        .filter((npc) => {
          if (seen.has(npc.id)) return false;
          seen.add(npc.id);
          return true;
        })
        .map((npc) => ({ ...npc, entityType: 'npc' as const }));
    }
    if (state.category === 'quests' && Array.isArray(rawQuests)) {
      let qList = rawQuests.filter(Boolean);
      const activeBand = state.subCategory || state.filterPill;
      if (activeBand && activeBand !== 'All' && activeBand !== 'All Levels') {
        qList = qList.filter((q) => isQuestInBand(q.minLevel ?? 1, activeBand));
      }
      const seen = new Set<string>();
      const deduped: FeedEntity[] = [];
      for (const q of qList) {
        const norm = (q.name || '').trim().toLowerCase();
        if (norm && seen.has(norm)) continue;
        if (norm) seen.add(norm);
        deduped.push({ ...q, entityType: 'quest' as const });
      }
      return deduped;
    }
    return [];
  }, [isItemCategory, state.category, state.subCategory, state.filterPill, rawItems, rawMobs, rawMaps, rawNpcs, rawQuests]);

  // Synchronous effective selected ID calculation:
  // If state.selectedId exists in feedItems, keep it.
  // Otherwise, IMMEDIATELY select the first item of the feed in the exact same render cycle!
  // This eliminates the 1-frame "selectedId: null" void that previously caused the blank screen!
  const effectiveSelectedId = useMemo(() => {
    if (state.selectedId && feedItems.some((i) => i.id === state.selectedId)) {
      return state.selectedId;
    }
    return feedItems.length > 0 ? feedItems[0].id : null;
  }, [state.selectedId, feedItems]);

  // Automatically synchronize state.selectedId with effectiveSelectedId when category shifts
  useEffect(() => {
    if (effectiveSelectedId && effectiveSelectedId !== state.selectedId) {
      updateState({ selectedId: effectiveSelectedId });
    }
  }, [effectiveSelectedId, state.selectedId, updateState]);

  // Extract selectedSummary optimistically from feedItems so InspectorVitrine renders immediately
  const selectedSummary = useMemo(() => {
    if (!effectiveSelectedId) return null;
    return feedItems.find((i) => i.id === effectiveSelectedId) || null;
  }, [feedItems, effectiveSelectedId]);

  // Derive effective category for entity detail queries
  const effectiveCategory = useMemo(() => {
    if (state.category !== 'all') return state.category;
    if (selectedSummary?.entityType === 'mob') return 'monsters';
    if (selectedSummary?.entityType === 'map') return 'maps';
    if (selectedSummary?.entityType === 'npc') return 'npcs';
    if (selectedSummary?.entityType === 'quest') return 'quests';
    if (selectedSummary?.entityType === 'item') return 'equips';
    return 'equips';
  }, [state.category, selectedSummary]);

  const isEffectiveItemCategory =
    effectiveCategory === 'equips' ||
    effectiveCategory === 'use' ||
    effectiveCategory === 'etc' ||
    effectiveCategory === 'setup' ||
    effectiveCategory === 'cash';

  // 9. Fetch Selected Entity Detail
  const selectedId = effectiveSelectedId;

  const { data: itemDetail = null, isLoading: itemDetailLoading } = useQuery({
    queryKey: ['itemDetail', state.region, state.version, selectedId],
    queryFn: () => (selectedId ? fetchItemDetail(state.region, state.version, selectedId) : null),
    enabled: isEffectiveItemCategory && !!selectedId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  const { data: mobDetail = null, isLoading: mobDetailLoading } = useQuery({
    queryKey: ['mobDetail', state.region, state.version, selectedId],
    queryFn: () => (selectedId ? fetchMobDetail(state.region, state.version, selectedId) : null),
    enabled: effectiveCategory === 'monsters' && !!selectedId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  const { data: mapDetail = null, isLoading: mapDetailLoading } = useQuery({
    queryKey: ['mapDetail', state.region, state.version, selectedId],
    queryFn: () => (selectedId ? fetchMapDetail(state.region, state.version, selectedId) : null),
    enabled: effectiveCategory === 'maps' && !!selectedId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  const { data: npcDetail = null, isLoading: npcDetailLoading } = useQuery({
    queryKey: ['npcDetail', state.region, state.version, selectedId],
    queryFn: () => (selectedId ? fetchNpcDetail(state.region, state.version, selectedId) : null),
    enabled: effectiveCategory === 'npcs' && !!selectedId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  const { data: questDetail = null, isLoading: questDetailLoading } = useQuery({
    queryKey: ['questDetail', state.region, state.version, selectedId],
    queryFn: () => (selectedId ? fetchQuestDetail(state.region, state.version, selectedId) : null),
    enabled: effectiveCategory === 'quests' && !!selectedId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 30,
  });

  const isFeedLoading =
    (isItemCategory && (itemsLoading || itemsFetching)) ||
    (state.category === 'monsters' && (mobsLoading || mobsFetching)) ||
    (state.category === 'maps' && (mapsLoading || mapsFetching)) ||
    (state.category === 'npcs' && (npcsLoading || npcsFetching)) ||
    (state.category === 'quests' && (questsLoading || questsFetching));

  const isInspectorLoading =
    itemDetailLoading || mobDetailLoading || mapDetailLoading || npcDetailLoading || questDetailLoading;

  // Handle navigation from internal clicks (e.g. from spawn maps, scrolls, or command palette)
  const handleNavigateToEntity = (cat: RegistryCategory, id: number, sub?: string) => {
    updateState({
      category: cat,
      subCategory: sub || '',
      selectedId: id,
      activeTab: 'overview',
      filterPill: 'All',
    });
  };

  // Bookmark active item
  const handleToggleActiveBookmark = () => {
    if (!selectedId) return;
    const activeEntity = feedItems.find((i) => i.id === selectedId);
    const name =
      itemDetail?.description?.name ||
      mobDetail?.name ||
      mapDetail?.name ||
      npcDetail?.name ||
      questDetail?.name ||
      activeEntity?.name ||
      `Entity #${selectedId}`;

    toggleBookmark({
      id: selectedId,
      name,
      category: state.category,
      subCategory: state.subCategory,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Top Global App Header */}
      <Header
        region={state.region}
        version={state.version}
        category={state.category}
        availableVersions={wzVersions}
        onSelectVersion={(r, v) => updateState({ region: r, version: v })}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
        bookmarkCount={bookmarks.length}
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((prev) => !prev)}
        currentView={state.view}
        onNavigateHome={() => updateState({ view: 'home' })}
        onNavigateWorkspace={() => updateState({ view: 'workspace' })}
      />

      {state.view === 'home' ? (
        <HomePage
          region={state.region}
          version={state.version}
          mobsCount={rawMobs.length || 101}
          mapsCount={rawMaps.length || 318}
          npcsCount={rawNpcs.length || 226}
          questsCount={rawQuests.length || 273}
          onSelectCategory={(cat, sub, grp, pill) => {
            updateState({
              view: 'workspace',
              category: cat,
              subCategory: sub || '',
              group: grp || '',
              filterPill: pill || 'All',
              searchQuery: '',
              selectedId: null,
              activeTab: 'overview',
            });
          }}
          onSelectEntity={(cat, id, sub) => {
            updateState({
              view: 'workspace',
              category: cat,
              subCategory: sub || '',
              selectedId: id,
              searchQuery: '',
              activeTab: 'overview',
            });
          }}
          onSearch={(query) => {
            updateState({
              view: 'workspace',
              category: 'all',
              searchQuery: query,
              selectedId: null,
            });
          }}
        />
      ) : (
        /* Seamless 3-Column Split View Workspace */
        <main className="flex-1 flex overflow-hidden w-full relative">
          {/* Pane 1: Left Taxonomy Tree */}
          <ErrorBoundary fallbackTitle="Taxonomy Tree">
            <SidebarTree
              activeCategory={state.category}
              activeSubCategory={state.subCategory || effectiveSubCategory}
              activeGroup={state.group}
              onSelect={(cat, sub, grp) =>
                updateState({
                  category: cat,
                  subCategory: sub,
                  group: grp || '',
                  filterPill: cat === 'quests' ? (sub || 'All') : 'All',
                  selectedId: null,
                  activeTab: 'overview',
                })
              }
              categoryTree={categoryTree}
              mobsCount={rawMobs.length || 101}
              mapsCount={rawMaps.length || 318}
              npcsCount={rawNpcs.length || 226}
              questsCount={rawQuests.length || 273}
              maps={rawMaps}
              region={state.region}
              version={state.version}
            />
          </ErrorBoundary>

          {/* Pane 2: Middle Stream Feed (Flexible width flex-1) */}
          <ErrorBoundary fallbackTitle="Stream Feed">
            <StreamFeed
              category={state.category}
              subCategory={state.subCategory || effectiveSubCategory}
              items={feedItems}
              selectedId={selectedId}
              onSelectId={(id) => updateState({ selectedId: id })}
              filterPill={state.category === 'quests' && state.subCategory ? state.subCategory : state.filterPill}
              onFilterPillChange={(pill) =>
                updateState({
                  filterPill: pill,
                  subCategory: state.category === 'quests' ? (pill === 'All' ? '' : pill) : state.subCategory,
                })
              }
              sortBy={state.sortBy}
              sortDirection={state.sortDirection}
              onToggleSort={(col) => {
                if (state.sortBy === col) {
                  updateState({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' });
                } else {
                  updateState({ sortBy: col, sortDirection: 'asc' });
                }
              }}
              region={state.region}
              version={state.version}
              isLoading={isFeedLoading}
              onSelectCategory={(cat, sub, grp, pill) => {
                updateState({
                  category: cat,
                  subCategory: sub || '',
                  group: grp || '',
                  filterPill: pill || 'All',
                  selectedId: null,
                  activeTab: 'overview',
                });
              }}
              searchQuery={state.searchQuery}
              onSearchQueryChange={(q) => updateState({ searchQuery: q })}
            />
          </ErrorBoundary>

          {/* Pane 3: Right Inspector & Sprite Vitrine (Compact fixed w-[460px]) */}
          {inspectorOpen && (
            <ErrorBoundary fallbackTitle="Inspector Vitrine">
              <InspectorVitrine
                category={state.category}
                subCategory={state.subCategory || effectiveSubCategory}
                selectedId={selectedId}
                selectedSummary={selectedSummary}
                activeTab={state.activeTab}
                onChangeTab={(t) => updateState({ activeTab: t })}
                region={state.region}
                version={state.version}
                itemDetail={itemDetail}
                mobDetail={mobDetail}
                mapDetail={mapDetail}
                npcDetail={npcDetail}
                questDetail={questDetail}
                allMaps={rawMaps}
                allMobs={rawMobs}
                allQuests={rawQuests}
                allScrolls={rawScrolls}
                onNavigateToEntity={handleNavigateToEntity}
                isBookmarked={selectedId ? isBookmarked(selectedId, state.category) : false}
                onToggleBookmark={handleToggleActiveBookmark}
                isLoading={isInspectorLoading}
              />
            </ErrorBoundary>
          )}
        </main>
      )}

      {/* Global ⌘K Command Palette Spotlight */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={(entity) => {
          handleNavigateToEntity(entity.category, entity.numericId, entity.subCategory);
        }}
      />

      {/* Bookmarks Slide-over Drawer */}
      <BookmarksDrawer
        isOpen={bookmarksDrawerOpen}
        onClose={() => setBookmarksDrawerOpen(false)}
        bookmarks={bookmarks}
        onSelect={(bm: BookmarkItem) => {
          handleNavigateToEntity(bm.category, bm.id, bm.subCategory);
        }}
        onRemove={(bm: BookmarkItem) => toggleBookmark(bm)}
      />
    </div>
  );
};
