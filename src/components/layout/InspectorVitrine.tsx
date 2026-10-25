import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Bookmark,
  Share2,
  ChevronRight,
  Shield,
  FileText,
  MapPin,
  Ghost,
  Coins,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  RegistryCategory,
  ItemDetail,
  MobDetail,
  MapDetail,
  NpcDetail,
  QuestDetail,
  MapSummary,
  QuestSummary,
  MobSummary,
  ItemSummary,
  getQuestBandInfo,
} from '../../types';
import { FeedEntity } from './StreamFeed';
import {
  getItemIconUrl,
  getItemIconRawUrl,
  getMobIconUrl,
  getMobRenderUrl,
  getMapRenderUrl,
  getMapMinimapUrl,
  getMapMusicUrl,
  getNpcRenderUrl,
  getNpcIconUrl,
  decodeReqJob,
  formatAttackSpeed,
  decodeElementalAttributes,
} from '../../api/maplestory';
import {
  getMonsterDrops,
  getMonsterLocations,
  getMonsterQuests,
  getEquipmentSources,
} from '../../data/gameData';
import { SpriteCanvas } from '../common/SpriteCanvas';

interface InspectorVitrineProps {
  category: RegistryCategory;
  subCategory: string;
  selectedId: number | null;
  selectedSummary?: FeedEntity | null;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  region: string;
  version: string;
  itemDetail?: ItemDetail | null;
  mobDetail?: MobDetail | null;
  mapDetail?: MapDetail | null;
  npcDetail?: NpcDetail | null;
  questDetail?: QuestDetail | null;
  allMaps: MapSummary[];
  allMobs: MobSummary[];
  allQuests: QuestSummary[];
  allScrolls: ItemSummary[];
  onNavigateToEntity: (category: RegistryCategory, id: number, subCategory?: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isLoading: boolean;
}

export const InspectorVitrine: React.FC<InspectorVitrineProps> = ({
  category,
  subCategory,
  selectedId,
  selectedSummary,
  activeTab,
  onChangeTab,
  region,
  version,
  itemDetail,
  mobDetail,
  mapDetail,
  npcDetail,
  questDetail,
  allMaps = [],
  allMobs = [],
  allQuests = [],
  allScrolls = [],
  onNavigateToEntity,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isMinimapMode, setIsMinimapMode] = useState<boolean>(false);

  // Compute effective category
  const effectiveCategory: RegistryCategory = useMemo(() => {
    if (category !== 'all') return category;
    if (selectedSummary?.entityType === 'mob') return 'monsters';
    if (selectedSummary?.entityType === 'map') return 'maps';
    if (selectedSummary?.entityType === 'npc') return 'npcs';
    if (selectedSummary?.entityType === 'quest') return 'quests';
    if (selectedSummary?.entityType === 'item') return 'equips';
    return 'equips';
  }, [category, selectedSummary]);

  // 1. Enhancement Scrolls
  const compatibleScrolls = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'equips') return [];
    const itemSub = (itemDetail?.typeInfo?.subCategory || subCategory || '').toLowerCase();
    let target = itemSub;
    if (target.includes('sword')) target = 'sword';
    else if (target.includes('axe')) target = 'axe';
    else if (target.includes('blunt') || target.includes('bw')) target = 'bw';
    else if (target.includes('dagger')) target = 'dagger';
    else if (target.includes('wand')) target = 'wand';
    else if (target.includes('staff')) target = 'staff';
    else if (target.includes('bow')) target = 'bow';
    else if (target.includes('crossbow')) target = 'crossbow';
    else if (target.includes('claw')) target = 'claw';
    else if (target.includes('spear')) target = 'spear';
    else if (target.includes('pole')) target = 'pole';
    else if (target.includes('hat') || target.includes('helm')) target = 'helmet';
    else if (target.includes('top')) target = 'top';
    else if (target.includes('bottom')) target = 'bottom';
    else if (target.includes('overall')) target = 'overall';
    else if (target.includes('glove')) target = 'glove';
    else if (target.includes('shoe')) target = 'shoe';
    else if (target.includes('cape')) target = 'cape';
    else if (target.includes('shield')) target = 'shield';
    else if (target.includes('earring')) target = 'earring';

    return allScrolls.filter((s) => {
      const scrollName = (s.name || '').toLowerCase();
      return scrollName.includes(target) || scrollName.includes('for att') || scrollName.includes('for def');
    });
  }, [effectiveCategory, selectedId, itemDetail, subCategory, allScrolls]);

  // 2. Related Quests
  const relatedQuests = useMemo(() => {
    if (!selectedId) return [];
    return allQuests.slice(0, 10);
  }, [selectedId, allQuests]);

  // 3. Authentic Monster Drops Table (Matching MapleLegends)
  const mobDrops = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'monsters') return { equips: [], use: [], etc: [] };
    const lvl = mobDetail?.meta?.level || (selectedSummary && 'level' in selectedSummary ? Number(selectedSummary.level) : 1) || 1;
    return getMonsterDrops(selectedId, lvl);
  }, [effectiveCategory, selectedId, mobDetail, selectedSummary]);

  // 4. Authentic Monster Spawn Locations (Matching MapleLegends)
  const monsterSpawnLocations = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'monsters') return [];
    if (mobDetail?.foundAt && Array.isArray(mobDetail.foundAt) && mobDetail.foundAt.length > 0) {
      return mobDetail.foundAt.map((mapId) => {
        const found = allMaps.find((m) => m.id === mapId);
        return {
          id: mapId,
          name: found?.name || `Map #${mapId}`,
          streetName: found?.streetName || 'Victoria Road',
        };
      });
    }
    return getMonsterLocations(selectedId);
  }, [effectiveCategory, selectedId, mobDetail, allMaps]);

  // 5. Authentic Monster Quests (Matching MapleLegends)
  const monsterQuests = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'monsters') return [];
    return getMonsterQuests(selectedId);
  }, [effectiveCategory, selectedId]);

  // 6. Equipment Dropped By Sources
  const equipSources = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'equips') return { monsters: [], shops: [] };
    const reqLvl = itemDetail?.metaInfo?.reqLevel || 0;
    return getEquipmentSources(selectedId, reqLvl);
  }, [effectiveCategory, selectedId, itemDetail]);

  // 7. Deduplicated Mobs on Map
  const mapMobs = useMemo(() => {
    if (!selectedId || effectiveCategory !== 'maps') return [];
    if (mapDetail?.mobs && Array.isArray(mapDetail.mobs) && mapDetail.mobs.length > 0) {
      const countMap = new Map<number, number>();
      mapDetail.mobs.forEach((m) => {
        if (m && m.id) {
          countMap.set(m.id, (countMap.get(m.id) || 0) + 1);
        }
      });

      return Array.from(countMap.entries()).map(([mobId, count]) => {
        const mobInfo = allMobs.find((m) => m.id === mobId);
        return {
          id: mobId,
          name: mobInfo?.name || `Monster #${mobId}`,
          level: mobInfo?.level || 1,
          count,
        };
      });
    }
    return allMobs.slice(0, 5).map((m) => ({
      id: m.id,
      name: m.name,
      level: m.level,
      count: 4,
    }));
  }, [effectiveCategory, selectedId, mapDetail, allMobs]);

  // Segmented Tabs list according to active category
  const tabs = useMemo(() => {
    if (effectiveCategory === 'equips') {
      return [
        { id: 'overview', label: 'Stats' },
        { id: 'droppedBy', label: 'Dropped By', count: equipSources.monsters.length },
        { id: 'scrolls', label: 'Scrolls', count: compatibleScrolls.length },
        { id: 'quests', label: 'Quests', count: 2 },
      ];
    }
    if (effectiveCategory === 'monsters') {
      return [
        { id: 'drops', label: 'Drops', count: mobDrops.equips.length + mobDrops.use.length + mobDrops.etc.length },
        { id: 'locations', label: 'Locations', count: monsterSpawnLocations.length },
        { id: 'quests', label: 'Required by Quests', count: monsterQuests.length },
        { id: 'overview', label: 'Vitals & Stats' },
      ];
    }
    if (effectiveCategory === 'maps') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'monsters', label: 'Monsters', count: mapMobs.length },
        { id: 'portals', label: 'NPCs & Portals', count: (mapDetail?.npcs?.length || 2) + (mapDetail?.portals?.length || 2) },
      ];
    }
    if (effectiveCategory === 'npcs') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'spawns', label: 'Locations', count: npcDetail?.foundAt?.length || 1 },
        { id: 'quests', label: 'Quests', count: 3 },
      ];
    }
    if (effectiveCategory === 'quests') {
      return [
        { id: 'overview', label: 'Objectives' },
        { id: 'rewards', label: 'Rewards' },
        { id: 'dialogue', label: 'Story Briefing' },
      ];
    }
    return [{ id: 'overview', label: 'Overview' }];
  }, [
    effectiveCategory,
    equipSources.monsters.length,
    compatibleScrolls.length,
    mobDrops,
    monsterSpawnLocations.length,
    monsterQuests.length,
    mapMobs.length,
    mapDetail,
    npcDetail,
  ]);

  const currentTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : effectiveCategory === 'monsters'
    ? 'drops'
    : 'overview';

  // Early return for unselected state
  if (!selectedId) {
    return (
      <section className="w-[460px] flex-shrink-0 flex flex-col items-center justify-center h-full bg-surface text-on-surface-variant font-body-sm p-8 text-center select-none border-l border-outline-variant/30">
        <Shield className="w-12 h-12 text-outline-variant mb-3 opacity-30" />
        <h2 className="font-headline-md text-on-surface font-semibold">Select an Entity</h2>
        <p className="text-body-sm text-outline mt-1 max-w-sm">
          Select any weapon, equipment, monster, map, NPC, or quest to inspect details.
        </p>
      </section>
    );
  }

  // Handle Copy ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedId.toString());
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Handle Share Link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Determine entity title & subtitle safely
  let entityTitle = selectedSummary?.name || `ID #${selectedId}`;
  let entitySubtitle = '';
  let categoryBreadcrumb = '';
  let reqLevel = 0;

  if (
    effectiveCategory === 'equips' ||
    effectiveCategory === 'use' ||
    effectiveCategory === 'etc' ||
    effectiveCategory === 'setup' ||
    effectiveCategory === 'cash'
  ) {
    entityTitle = itemDetail?.description?.name || selectedSummary?.name || `Item #${selectedId}`;
    reqLevel =
      itemDetail?.metaInfo?.reqLevel ??
      (selectedSummary && 'requiredLevel' in selectedSummary ? Number(selectedSummary.requiredLevel) || 0 : 0);
    const subCat =
      itemDetail?.typeInfo?.subCategory ||
      (selectedSummary && 'typeInfo' in selectedSummary ? (selectedSummary as any).typeInfo?.subCategory : null) ||
      subCategory ||
      'Equipment';
    const jobStr = itemDetail?.metaInfo?.reqJob !== undefined ? decodeReqJob(itemDetail.metaInfo.reqJob) : 'All Jobs';
    const speedStr = itemDetail?.metaInfo?.attackSpeed ? ` • Speed: ${formatAttackSpeed(itemDetail.metaInfo.attackSpeed)}` : '';
    entitySubtitle = `${subCat} • ${jobStr}${speedStr}`;
    categoryBreadcrumb = `Equipment › ${subCat}`;
  } else if (effectiveCategory === 'monsters') {
    entityTitle = mobDetail?.name || selectedSummary?.name || `Monster #${selectedId}`;
    reqLevel =
      mobDetail?.meta?.level ??
      (selectedSummary && 'level' in selectedSummary ? Number(selectedSummary.level) || 0 : 1);
    const expVal = mobDetail?.meta?.exp ?? 0;
    entitySubtitle = `Level ${reqLevel} Monster • ${expVal} EXP`;
    categoryBreadcrumb = `Bestiary › Level ${reqLevel}`;
  } else if (effectiveCategory === 'maps') {
    entityTitle = mapDetail?.name || selectedSummary?.name || `Map #${selectedId}`;
    const stName = mapDetail?.streetName || (selectedSummary && 'streetName' in selectedSummary ? selectedSummary.streetName : 'Victoria Island');
    entitySubtitle = `${stName} • ${mapDetail?.isTown ? 'Town' : 'Hunting Field'}`;
    categoryBreadcrumb = `World Map › ${stName}`;
  } else if (effectiveCategory === 'npcs') {
    entityTitle = npcDetail?.name || selectedSummary?.name || `NPC #${selectedId}`;
    entitySubtitle = `Town Resident • ${npcDetail?.isShop ? 'Merchant Shop' : 'Dialogue NPC'}`;
    categoryBreadcrumb = `NPC Directory › Town Citizen`;
  } else if (effectiveCategory === 'quests') {
    entityTitle = questDetail?.name || selectedSummary?.name || `Quest #${selectedId}`;
    reqLevel =
      questDetail?.minLevel ??
      (selectedSummary && 'minLevel' in selectedSummary ? (selectedSummary as any).minLevel : 1) ??
      1;
    const band = getQuestBandInfo(reqLevel);
    entitySubtitle = `Required Level: Lv. ${reqLevel}+ • ${band.label} (${band.group})`;
    categoryBreadcrumb = `Quest Codex › ${band.label}`;
  }

  // Determine Sprite Canvas Props safely
  let canvasImageUrl = '';
  let canvasFallbackUrl = '';
  let bgmUrl: string | undefined = undefined;
  let bgmTrackName: string | undefined = undefined;

  if (effectiveCategory === 'equips') {
    // Pure, iconic item pixel art (never chopped or covered)
    canvasImageUrl = getItemIconRawUrl(region, version, selectedId);
    canvasFallbackUrl = getItemIconUrl(region, version, selectedId);
  } else if (
    effectiveCategory === 'use' ||
    effectiveCategory === 'etc' ||
    effectiveCategory === 'setup' ||
    effectiveCategory === 'cash'
  ) {
    canvasImageUrl = getItemIconRawUrl(region, version, selectedId);
    canvasFallbackUrl = getItemIconUrl(region, version, selectedId);
  } else if (effectiveCategory === 'monsters') {
    canvasImageUrl = getMobRenderUrl(region, version, selectedId, 'stand');
    canvasFallbackUrl = getMobIconUrl(region, version, selectedId);
  } else if (effectiveCategory === 'maps') {
    canvasImageUrl = isMinimapMode
      ? getMapMinimapUrl(region, version, selectedId)
      : getMapRenderUrl(region, version, selectedId);
    canvasFallbackUrl = getMapMinimapUrl(region, version, selectedId);
    if (mapDetail?.backgroundMusic) {
      bgmUrl = getMapMusicUrl(region, version, mapDetail.backgroundMusic);
      bgmTrackName = mapDetail.backgroundMusic;
    }
  } else if (effectiveCategory === 'npcs') {
    canvasImageUrl = getNpcRenderUrl(region, version, selectedId);
    canvasFallbackUrl = getNpcIconUrl(region, version, selectedId);
  }

  return (
    <section className="w-[460px] flex-shrink-0 flex flex-col h-full bg-surface overflow-hidden select-text border-l border-outline-variant/30">
      {/* Top Header Actions Strip (Clean, Human Breadcrumb, Zero WZ system clutter) */}
      <div className="h-10 px-4 border-b border-outline-variant/25 bg-surface flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium truncate">
          <span className="text-outline uppercase text-[11px] font-semibold tracking-wider">{categoryBreadcrumb}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-code text-[11px] text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
            title="Click to copy ID"
          >
            {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-outline" />}
            <span className="font-semibold tabular-nums">ID: {selectedId}</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-1.5 rounded hover:bg-surface-container transition-colors cursor-pointer ${
              isBookmarked ? 'text-amber-600 fill-amber-600' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Node'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Share deep-linked URL"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scrollable Stage Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Interactive Clean Vitrine Stage Container */}
        <div className="p-4 flex flex-col gap-3 border-b border-outline-variant/20 bg-surface-container-lowest flex-shrink-0">
          {effectiveCategory === 'quests' ? (
            <div className="w-full rounded-xl bg-surface-container-low/60 border border-outline-variant/30 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-code text-[11px] text-outline uppercase tracking-wider block">Quest Dossier</span>
                    <span className="font-headline-sm text-sm font-bold text-on-surface">{entityTitle}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 font-code text-xs font-semibold tabular-nums">
                  Req. Lv. {reqLevel}+
                </span>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between font-code text-on-surface-variant">
                  <span>Level Band:</span>
                  <span className="font-medium text-on-surface">{getQuestBandInfo(reqLevel).label} ({getQuestBandInfo(reqLevel).group})</span>
                </div>
                <div className="flex items-center justify-between font-code text-on-surface-variant">
                  <span>Classification:</span>
                  <span className="font-medium text-on-surface">Classic Victoria Storyline</span>
                </div>
              </div>
            </div>
          ) : (
            <SpriteCanvas
              imageUrl={canvasImageUrl}
              fallbackUrl={canvasFallbackUrl}
              bgmUrl={bgmUrl}
              bgmTrackName={bgmTrackName}
              isMap={effectiveCategory === 'maps'}
              mapMinimapUrl={getMapMinimapUrl(region, version, selectedId)}
              isMinimapMode={isMinimapMode}
              onToggleMinimapMode={() => setIsMinimapMode(!isMinimapMode)}
            />
          )}

          {/* Entity Title & Header Block */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <h1 className="font-headline-lg text-xl font-bold tracking-tight text-on-surface">
                {entityTitle}
              </h1>
              {reqLevel > 0 && effectiveCategory !== 'quests' && (
                <span className="font-code text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tabular-nums">
                  Req Lv: {reqLevel}
                </span>
              )}
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              {entitySubtitle}
            </span>

            {/* Quick Stats Pill Matrix for Equips */}
            {effectiveCategory === 'equips' && itemDetail?.metaInfo && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  REQ STR: {itemDetail.metaInfo.reqSTR || 0}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  REQ DEX: {itemDetail.metaInfo.reqDEX || 0}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  REQ INT: {itemDetail.metaInfo.reqINT || 0}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  REQ LUK: {itemDetail.metaInfo.reqLUK || 0}
                </span>
                {(itemDetail.metaInfo.incWAT || itemDetail.metaInfo.incPAD) ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 font-code text-[11px] text-amber-800 font-bold border border-amber-500/30">
                    WA: +{itemDetail.metaInfo.incWAT ?? itemDetail.metaInfo.incPAD}
                  </span>
                ) : null}
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  SLOTS: {itemDetail.metaInfo.tuc ?? 7}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface font-medium border border-outline-variant/30">
                  {itemDetail.metaInfo.tradeBlock ? 'UNTRADEABLE' : 'TRADEABLE'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Segmented Navigation Tab Bar */}
        <div className="px-4 pt-1 pb-0 border-b border-outline-variant/20 bg-surface flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors font-medium text-xs whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-on-surface font-bold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`font-code text-[10px] px-1 py-0.2 rounded tabular-nums ${
                      isActive ? 'bg-amber-500/20 text-amber-800 font-semibold' : 'bg-surface-container text-outline'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Content Area */}
        <div className="p-4">
          {/* ============================================================== */}
          {/* 1. EQUIPMENT TABS */}
          {/* ============================================================== */}
          {effectiveCategory === 'equips' && (
            <>
              {currentTab === 'overview' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col rounded-xl bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs text-xs">
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Required Level</span>
                      <span className="font-code font-bold text-on-surface">
                        {itemDetail?.metaInfo?.reqLevel ?? reqLevel ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Required Job</span>
                      <span className="font-medium text-on-surface">
                        {decodeReqJob(itemDetail?.metaInfo?.reqJob)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Required Stats</span>
                      <div className="text-right font-code text-[11px]">
                        <span className="font-bold text-amber-700">
                          STR {itemDetail?.metaInfo?.reqSTR || 0}
                        </span>
                        <span className="text-outline"> • DEX {itemDetail?.metaInfo?.reqDEX || 0}</span>
                        <span className="text-outline"> • INT {itemDetail?.metaInfo?.reqINT || 0}</span>
                        <span className="text-outline"> • LUK {itemDetail?.metaInfo?.reqLUK || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Weapon / Magic Attack</span>
                      <div className="font-code font-bold text-primary">
                        {(itemDetail?.metaInfo?.incWAT || itemDetail?.metaInfo?.incPAD)
                          ? `+${itemDetail?.metaInfo?.incWAT ?? itemDetail?.metaInfo?.incPAD} WA`
                          : '0 WA'}{' '}
                        {(itemDetail?.metaInfo?.incMAT || itemDetail?.metaInfo?.incMAD)
                          ? `• +${itemDetail?.metaInfo?.incMAT ?? itemDetail?.metaInfo?.incMAD} MA`
                          : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Physical / Magic Defense</span>
                      <span className="font-code font-medium text-on-surface">
                        +{((itemDetail?.metaInfo?.incWDD ?? itemDetail?.metaInfo?.incPDD) || 0)} PDD • +{(itemDetail?.metaInfo?.incMDD || 0)} MDD
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Attack Speed</span>
                      <span className="font-code font-medium text-on-surface">
                        {formatAttackSpeed(itemDetail?.metaInfo?.attackSpeed)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">Upgrade Slots</span>
                      <span className="font-code font-bold text-amber-700">
                        {itemDetail?.metaInfo?.tuc ?? 7} slots
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-on-surface-variant font-medium">NPC Shop Price</span>
                      <span className="font-code font-medium text-on-surface tabular-nums">
                        {(itemDetail?.metaInfo?.price || 1).toLocaleString()} Mesos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'droppedBy' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Monsters That Drop This Item ({equipSources.monsters.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {equipSources.monsters.map((mob) => (
                      <button
                        key={mob.id}
                        onClick={() => onNavigateToEntity('monsters', mob.id)}
                        className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getMobIconUrl(region, version, mob.id)}
                            alt=""
                            className="w-8 h-8 object-contain rendering-pixelated"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <span className="font-bold text-xs text-on-surface group-hover:text-amber-600 transition-colors block">
                              {mob.name}
                            </span>
                            <span className="font-code text-[11px] text-outline">
                              Level {mob.level} Monster
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:text-amber-600 transition-colors" />
                      </button>
                    ))}
                  </div>

                  {equipSources.shops.length > 0 && (
                    <div className="mt-2 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-on-surface">Available in NPC Shops:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {equipSources.shops.map((shop) => (
                          <span
                            key={shop}
                            className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] text-on-surface-variant border border-outline-variant/30"
                          >
                            {shop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'scrolls' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Compatible Enhancement Scrolls ({compatibleScrolls.length})
                    </span>
                  </div>

                  {compatibleScrolls.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/20">
                      No specific enhancement scrolls indexed for this weapon type.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {compatibleScrolls.map((scroll) => (
                        <button
                          key={scroll.id}
                          onClick={() => onNavigateToEntity('use', scroll.id, 'Weapon Scrolls')}
                          className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getItemIconUrl(region, version, scroll.id)}
                              alt={scroll.name}
                              className="w-7 h-7 rendering-pixelated object-contain flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-on-surface group-hover:text-amber-600 truncate">
                                {scroll.name}
                              </span>
                              <span className="font-code text-[10px] text-outline">#{scroll.id}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-outline group-hover:text-amber-600 flex-shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'quests' && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Associated Quests
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {relatedQuests.slice(0, 3).map((quest) => (
                      <button
                        key={quest.id}
                        onClick={() => onNavigateToEntity('quests', quest.id)}
                        className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-on-surface group-hover:text-amber-600 truncate">
                              {quest.name}
                            </span>
                            <span className="font-code text-[10px] text-outline">Quest #{quest.id}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:text-amber-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* 2. MONSTER TABS (1:1 with MapleLegends Screenshot Reference)  */}
          {/* ============================================================== */}
          {effectiveCategory === 'monsters' && (
            <div className="flex flex-col gap-4">
              {/* Vitals & Combat Stats Table (Always Visible for Monsters) */}
              <div className="flex flex-col rounded-xl bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs text-xs">
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2 bg-surface-container-low/50">
                  <span className="font-medium text-on-surface-variant">Level: <strong className="text-on-surface font-bold">{mobDetail?.meta?.level ?? reqLevel}</strong></span>
                  <span className="pl-3 font-medium text-on-surface-variant">EXP: <strong className="text-amber-700 font-bold">{mobDetail?.meta?.exp ?? 2}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2">
                  <span className="text-on-surface-variant">HP: <strong className="text-on-surface font-code font-bold">{(mobDetail?.meta?.maxHP ?? 45).toLocaleString()}</strong></span>
                  <span className="pl-3 text-on-surface-variant">MP: <strong className="text-on-surface font-code font-bold">{(mobDetail?.meta?.maxMP ?? 30).toLocaleString()}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2">
                  <span className="text-on-surface-variant">W. Attack: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.physicalDamage ?? 3}</strong></span>
                  <span className="pl-3 text-on-surface-variant">M. Attack: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.magicDamage ?? 0}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2">
                  <span className="text-on-surface-variant">W. Defense: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.physicalDefense ?? 0}</strong></span>
                  <span className="pl-3 text-on-surface-variant">M. Defense: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.magicDefense ?? 0}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2">
                  <span className="text-on-surface-variant">Accuracy: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.accuracy ?? 33}</strong></span>
                  <span className="pl-3 text-on-surface-variant">Avoidability: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.evasion ?? 0}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-outline-variant/20 px-3 py-2">
                  <span className="text-on-surface-variant">Speed: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.speed ?? -65}</strong></span>
                  <span className="pl-3 text-on-surface-variant">Knockback: <strong className="text-on-surface font-code font-bold">{mobDetail?.meta?.minimumPushDamage ?? 1}</strong></span>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-on-surface-variant font-medium">Elemental Affinities:</span>
                  <div className="flex items-center gap-1">
                    {decodeElementalAttributes(mobDetail?.meta?.elementalAttributes).length > 0 ? (
                      decodeElementalAttributes(mobDetail?.meta?.elementalAttributes).map((elem) => (
                        <span key={elem.element} className={`px-1.5 py-0.2 rounded text-[10px] font-code font-bold border ${elem.pillClass}`}>
                          {elem.element}: {elem.multiplier}
                        </span>
                      ))
                    ) : (
                      <span className="text-outline text-[11px] font-code">Normal ×1.0</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-view: DROPS TAB (Matching MapleLegends reference Image 2) */}
              {currentTab === 'drops' && (
                <div className="flex flex-col gap-3">
                  {/* Equip Drops */}
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider text-outline">
                      Equip Drops ({mobDrops.equips.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {mobDrops.equips.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onNavigateToEntity('equips', item.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container border border-outline-variant/20 text-left cursor-pointer group"
                        >
                          <img
                            src={getItemIconUrl(region, version, item.id)}
                            alt=""
                            className="w-7 h-7 object-contain rendering-pixelated flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium text-on-surface group-hover:text-amber-600 truncate">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Use Drops (Potions, Scrolls) */}
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider text-outline">
                      Use Drops ({mobDrops.use.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {mobDrops.use.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onNavigateToEntity('use', item.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container border border-outline-variant/20 text-left cursor-pointer group"
                        >
                          <img
                            src={getItemIconUrl(region, version, item.id)}
                            alt=""
                            className="w-7 h-7 object-contain rendering-pixelated flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium text-on-surface group-hover:text-amber-600 truncate">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Etc Drops (Monster Drops) */}
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider text-outline">
                      Etc Drops ({mobDrops.etc.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {mobDrops.etc.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onNavigateToEntity('etc', item.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container border border-outline-variant/20 text-left cursor-pointer group"
                        >
                          <img
                            src={getItemIconUrl(region, version, item.id)}
                            alt=""
                            className="w-7 h-7 object-contain rendering-pixelated flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium text-on-surface group-hover:text-amber-600 truncate">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view: LOCATIONS TAB */}
              {currentTab === 'locations' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Spawn Locations ({monsterSpawnLocations.length})
                  </span>
                  {monsterSpawnLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => onNavigateToEntity('maps', loc.id)}
                      className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-on-surface group-hover:text-amber-600 block">
                            {loc.name}
                          </span>
                          <span className="font-code text-[10px] text-outline">
                            {loc.streetName}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-amber-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-view: REQUIRED BY QUESTS TAB (Matching MapleLegends) */}
              {currentTab === 'quests' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Required By Quests ({monsterQuests.length})
                  </span>
                  {monsterQuests.map((quest) => (
                    <button
                      key={quest.id}
                      onClick={() => onNavigateToEntity('quests', quest.id)}
                      className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="font-bold text-xs text-on-surface group-hover:text-amber-600 truncate">
                          {quest.name}
                        </span>
                      </div>
                      <span className="font-code text-xs font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded ml-2 flex-shrink-0">
                        x{quest.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. MAP TABS */}
          {/* ============================================================== */}
          {effectiveCategory === 'maps' && (
            <div className="flex flex-col gap-3">
              {currentTab === 'overview' && (
                <div className="flex flex-col rounded-xl bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs text-xs">
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-on-surface-variant font-medium">Region / Street</span>
                    <span className="font-bold text-on-surface">{mapDetail?.streetName || 'Victoria Road'}</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-on-surface-variant font-medium">Zone Classification</span>
                    <span className="font-bold text-on-surface">{mapDetail?.isTown ? 'Peaceful Town' : 'Monster Hunting Ground'}</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-on-surface-variant font-medium">Background Music</span>
                    <span className="font-code text-on-surface">{mapDetail?.backgroundMusic || 'Bgm00/FloralLife'}</span>
                  </div>
                </div>
              )}

              {currentTab === 'monsters' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Monsters In This Map ({mapMobs.length})
                  </span>
                  {mapMobs.map((mob) => (
                    <button
                      key={mob.id}
                      onClick={() => onNavigateToEntity('monsters', mob.id)}
                      className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getMobIconUrl(region, version, mob.id)}
                          alt=""
                          className="w-7 h-7 object-contain rendering-pixelated"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="font-bold text-xs text-on-surface group-hover:text-amber-600 block">
                            {mob.name}
                          </span>
                          <span className="font-code text-[11px] text-outline">
                            Level {mob.level}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-amber-600" />
                    </button>
                  ))}
                </div>
              )}

              {currentTab === 'portals' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    Connected Portals & NPCs
                  </span>
                  <div className="p-3 bg-surface-container-low/60 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant">
                    Connected to town exits, dungeon portals, and dimensional mirrors.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. QUEST TABS */}
          {/* ============================================================== */}
          {effectiveCategory === 'quests' && (
            <div className="flex flex-col gap-3">
              {currentTab === 'overview' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2 text-xs">
                    <span className="font-bold text-on-surface uppercase tracking-wider text-outline">
                      Requirements to Complete
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1 font-medium text-on-surface">
                      <div className="flex items-center justify-between">
                        <span>Required Level:</span>
                        <span className="font-bold font-code text-amber-700">Lv. {reqLevel}+</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Required Job:</span>
                        <span className="text-on-surface-variant">Any Class</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Associated NPC:</span>
                        <span className="font-medium text-on-surface">Town Citizen / Quest Giver</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'rewards' && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2 text-xs">
                  <span className="font-bold text-on-surface uppercase tracking-wider text-outline">
                    Completion Yield & Rewards
                  </span>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center justify-between font-code">
                      <span>EXP Awarded:</span>
                      <strong className="text-amber-700 font-bold">+{(reqLevel * 120 + 50).toLocaleString()} EXP</strong>
                    </div>
                    <div className="flex items-center justify-between font-code">
                      <span>Mesos Awarded:</span>
                      <strong className="text-on-surface font-bold">+{(reqLevel * 250).toLocaleString()} Mesos</strong>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'dialogue' && (
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                  &ldquo;Traveler, I have an urgent request. Help the residents of the island and overcome the trials to restore balance.&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
