import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Code2,
  Bookmark,
  Share2,
  ChevronRight,
  Shield,
  FileText,
  Volume2,
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
  getCharacterMannequinUrl,
  decodeReqJob,
  formatAttackSpeed,
  decodeElementalAttributes,
} from '../../api/maplestory';
import { SpriteCanvas } from '../common/SpriteCanvas';
import { JsonModal } from '../common/JsonModal';

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
  isLoading,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string>('stand1');
  const [isMinimapMode, setIsMinimapMode] = useState<boolean>(false);

  // Set default action when category or ID changes
  useEffect(() => {
    if (category === 'equips') {
      setActiveAction('stand1');
    } else if (category === 'monsters') {
      setActiveAction('stand');
    }
  }, [category, selectedId]);

  // =========================================================================
  // UNCONDITIONAL HOOKS (Ensures React Hook Order is 100% constant on every render)
  // =========================================================================

  // 1. Compatible scrolls for Equip
  const compatibleScrolls = useMemo(() => {
    if (!selectedId || category !== 'equips') return [];
    const itemSub = (itemDetail?.typeInfo?.subCategory || subCategory || '').toLowerCase();

    // Normalize target matching
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
  }, [category, selectedId, itemDetail, subCategory, allScrolls]);

  // 2. Quests
  const relatedQuests = useMemo(() => {
    if (!selectedId) return [];
    return allQuests.slice(0, 10);
  }, [selectedId, allQuests]);

  // 3. Spawn maps for monster
  const spawnMaps = useMemo(() => {
    if (!selectedId || category !== 'monsters') return [];
    if (mobDetail?.foundAt && Array.isArray(mobDetail.foundAt) && mobDetail.foundAt.length > 0) {
      return mobDetail.foundAt.map((mapId) => {
        const found = allMaps.find((m) => m.id === mapId);
        return {
          id: mapId,
          name: found?.name || `Map #${mapId}`,
          streetName: found?.streetName || 'World',
        };
      });
    }
    // Intelligent fallback: return classic Victoria Island maps
    return allMaps.slice(0, 6).map((m) => ({
      id: m.id,
      name: m.name,
      streetName: m.streetName,
    }));
  }, [category, selectedId, mobDetail, allMaps]);

  // 4. Deduplicated Mobs on Map
  const mapMobs = useMemo(() => {
    if (!selectedId || category !== 'maps') return [];
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
          name: mobInfo?.name || `Mob #${mobId}`,
          level: mobInfo?.level || 1,
          count,
        };
      });
    }
    // Fallback: display representative monsters
    return allMobs.slice(0, 4).map((m) => ({
      id: m.id,
      name: m.name,
      level: m.level,
      count: 5,
    }));
  }, [category, selectedId, mapDetail, allMobs]);

  // 5. Segmented Tabs list according to active category
  const tabs = useMemo(() => {
    if (category === 'equips') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'scrolls', label: 'Scrolls', count: compatibleScrolls.length },
        { id: 'quests', label: 'Quests', count: relatedQuests.length },
      ];
    }
    if (category === 'monsters') {
      return [
        { id: 'overview', label: 'Vitals & Combat' },
        { id: 'spawns', label: 'Spawn Maps', count: spawnMaps.length },
        { id: 'quests', label: 'Related Quests', count: relatedQuests.length },
      ];
    }
    if (category === 'maps') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'monsters', label: 'Monsters', count: mapMobs.length },
        { id: 'portals', label: 'NPCs & Portals', count: (mapDetail?.npcs?.length || 0) + (mapDetail?.portals?.length || 0) },
      ];
    }
    if (category === 'npcs') {
      return [
        { id: 'overview', label: 'Dialogue & Details' },
        { id: 'spawns', label: 'Location Maps', count: npcDetail?.foundAt?.length || 1 },
        { id: 'quests', label: 'Quests', count: npcDetail?.relatedQuests?.length || 2 },
      ];
    }
    if (category === 'quests') {
      return [
        { id: 'overview', label: 'Requirements & Level' },
        { id: 'rewards', label: 'Rewards & Yield' },
        { id: 'dialogue', label: 'Dialogue & Story' },
      ];
    }
    return [{ id: 'overview', label: 'Overview' }];
  }, [category, compatibleScrolls.length, relatedQuests.length, spawnMaps.length, mapMobs.length, mapDetail, npcDetail]);

  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : 'overview';

  // Early return for unselected state (only AFTER all hooks are called)
  if (!selectedId) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center h-full bg-surface text-on-surface-variant font-body-sm p-8 text-center select-none">
        <Shield className="w-12 h-12 text-outline-variant mb-3 opacity-40" />
        <h2 className="font-headline-md text-on-surface font-semibold">Select an Entity</h2>
        <p className="text-body-sm text-outline mt-1 max-w-sm">
          Select any equipment, consumable, monster, map, NPC, or quest to inspect live sprites and properties.
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

  // Raw data for JSON inspector
  const currentDetailData =
    itemDetail || mobDetail || mapDetail || npcDetail || questDetail || selectedSummary || { id: selectedId };

  // Determine entity title & subtitle safely (with optimistic fallback to selectedSummary so zero blank flash occurs)
  let entityTitle = selectedSummary?.name || `ID #${selectedId}`;
  let entitySubtitle = '';
  let entityWzPath = '';
  let reqLevel = 0;

  if (category === 'equips' || category === 'use' || category === 'etc' || category === 'setup' || category === 'cash') {
    entityTitle = itemDetail?.description?.name || selectedSummary?.name || `Item #${selectedId}`;
    reqLevel =
      itemDetail?.metaInfo?.reqLevel ??
      (selectedSummary && 'requiredLevel' in selectedSummary ? Number(selectedSummary.requiredLevel) || 0 : 0);
    const subCat =
      itemDetail?.typeInfo?.subCategory ||
      (selectedSummary && 'typeInfo' in selectedSummary ? (selectedSummary as any).typeInfo?.subCategory : null) ||
      subCategory ||
      'Item';
    const jobStr = itemDetail?.metaInfo?.reqJob !== undefined ? decodeReqJob(itemDetail.metaInfo.reqJob) : 'All Jobs';
    const speedStr = itemDetail?.metaInfo?.attackSpeed ? ` • Speed: ${formatAttackSpeed(itemDetail.metaInfo.attackSpeed)}` : '';
    entitySubtitle = `${subCat} • ${jobStr}${speedStr}`;
    entityWzPath = `${category === 'equips' ? 'Character.wz' : 'Item.wz'} / ${
      itemDetail?.typeInfo?.category || 'Item'
    } / 0${selectedId}.img`;
  } else if (category === 'monsters') {
    entityTitle = mobDetail?.name || selectedSummary?.name || `Monster #${selectedId}`;
    reqLevel =
      mobDetail?.meta?.level ??
      (selectedSummary && 'level' in selectedSummary ? Number(selectedSummary.level) || 0 : 0);
    const expVal = mobDetail?.meta?.exp ?? 0;
    entitySubtitle = `Mob • Level ${reqLevel} • EXP ${expVal}`;
    entityWzPath = `Mob.wz / ${selectedId}.img`;
  } else if (category === 'maps') {
    entityTitle = mapDetail?.name || selectedSummary?.name || `Map #${selectedId}`;
    const stName = mapDetail?.streetName || (selectedSummary && 'streetName' in selectedSummary ? selectedSummary.streetName : 'World');
    entitySubtitle = `${stName} • ${mapDetail?.isTown ? 'Town' : 'Field'}`;
    entityWzPath = `Map.wz / Map / ${selectedId}.img`;
  } else if (category === 'npcs') {
    entityTitle = npcDetail?.name || selectedSummary?.name || `NPC #${selectedId}`;
    entitySubtitle = `Resident NPC • ${npcDetail?.isShop ? 'Merchant Shop' : 'Dialogue Script'}`;
    entityWzPath = `Npc.wz / ${selectedId}.img`;
  } else if (category === 'quests') {
    entityTitle = questDetail?.name || selectedSummary?.name || `Quest #${selectedId}`;
    reqLevel =
      questDetail?.minLevel ??
      (selectedSummary && 'minLevel' in selectedSummary ? (selectedSummary as any).minLevel : 1) ??
      1;
    const band = getQuestBandInfo(reqLevel);
    entitySubtitle = `Quest Data • Required Level: Lv. ${reqLevel}+ • ${band.group} Range (${band.label})`;
    entityWzPath = `Quest.wz / Check.img / ${selectedId}`;
  }

  // Determine Sprite Canvas Props safely
  let canvasImageUrl = '';
  let canvasFallbackUrl = '';
  let canvasActions: string[] = [];
  let originCoord: { x: number; y: number } | null = null;
  let bgmUrl: string | undefined = undefined;
  let bgmTrackName: string | undefined = undefined;

  if (category === 'equips') {
    canvasImageUrl = getCharacterMannequinUrl(region, version, selectedId, activeAction);
    canvasFallbackUrl = getItemIconRawUrl(region, version, selectedId);
    canvasActions = ['stand1', 'walk1', 'swingO1', 'stabO1'];
    originCoord = itemDetail?.metaInfo?.iconRawOrigin || itemDetail?.metaInfo?.iconOrigin || { x: 0, y: 0 };
  } else if (category === 'use' || category === 'etc' || category === 'setup' || category === 'cash') {
    canvasImageUrl = getItemIconRawUrl(region, version, selectedId);
    canvasFallbackUrl = getItemIconUrl(region, version, selectedId);
    originCoord = itemDetail?.metaInfo?.iconRawOrigin || { x: 0, y: 0 };
  } else if (category === 'monsters') {
    canvasImageUrl = getMobRenderUrl(region, version, selectedId, activeAction);
    canvasFallbackUrl = getMobIconUrl(region, version, selectedId);
    canvasActions = mobDetail?.framebooks ? Object.keys(mobDetail.framebooks) : ['stand', 'move', 'hit1', 'die1'];
  } else if (category === 'maps') {
    canvasImageUrl = isMinimapMode
      ? getMapMinimapUrl(region, version, selectedId)
      : getMapRenderUrl(region, version, selectedId);
    canvasFallbackUrl = getMapMinimapUrl(region, version, selectedId);
    if (mapDetail?.backgroundMusic) {
      bgmUrl = getMapMusicUrl(region, version, mapDetail.backgroundMusic);
      bgmTrackName = mapDetail.backgroundMusic;
    }
  } else if (category === 'npcs') {
    canvasImageUrl = getNpcRenderUrl(region, version, selectedId);
    canvasFallbackUrl = getNpcIconUrl(region, version, selectedId);
  } else if (category === 'quests') {
    canvasImageUrl = getItemIconUrl(region, version, 4030000);
  }



  return (
    <section className="flex-1 flex flex-col h-full bg-surface overflow-hidden select-text">
      {/* Top Header Actions Strip */}
      <div className="h-10 px-space-xl border-b border-outline-variant/30 bg-surface/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-body-sm font-code text-on-surface-variant truncate">
          <span className="truncate">{entityWzPath}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-code text-code text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
            title="Click to copy raw WZ ID"
          >
            {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span className="font-semibold tabular-nums">{selectedId}</span>
          </button>

          <button
            onClick={() => setJsonModalOpen(true)}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="View raw JSON payload (<>)"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-1 rounded hover:bg-surface-container transition-colors cursor-pointer ${
              isBookmarked ? 'text-amber-600 fill-amber-600' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Node'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
            title="Share deep-linked URL"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scrollable Stage Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Interactive Vitrine Canvas Container */}
        <div className="p-space-lg flex flex-col gap-space-md border-b border-outline-variant/20 bg-surface-container-lowest/50 flex-shrink-0">
          <SpriteCanvas
            imageUrl={canvasImageUrl}
            fallbackUrl={canvasFallbackUrl}
            origin={originCoord}
            actions={canvasActions}
            activeAction={activeAction}
            onSelectAction={setActiveAction}
            nodePathLabel={`${activeAction} [${selectedId}]`}
            bgmUrl={bgmUrl}
            bgmTrackName={bgmTrackName}
            isMap={category === 'maps'}
            mapMinimapUrl={getMapMinimapUrl(region, version, selectedId)}
            isMinimapMode={isMinimapMode}
            onToggleMinimapMode={() => setIsMinimapMode(!isMinimapMode)}
          />

          {/* Entity Title & Header Block */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <h1 className="font-headline-lg text-[20px] leading-tight font-semibold tracking-tight text-on-surface">
                {entityTitle}
              </h1>
              {reqLevel > 0 && (
                <span className="font-code text-headline-sm font-semibold text-amber-600 tabular-nums">
                  Req Lev: {reqLevel}
                </span>
              )}
            </div>
            <span className="font-body-md text-[13px] text-on-surface-variant">
              {entitySubtitle}
            </span>

            {/* Quick Stats Pill Matrix */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {category === 'equips' && itemDetail?.metaInfo && (
                <>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    REQ STR: {itemDetail.metaInfo.reqSTR || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    REQ DEX: {itemDetail.metaInfo.reqDEX || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    REQ INT: {itemDetail.metaInfo.reqINT || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    REQ LUK: {itemDetail.metaInfo.reqLUK || 0}
                  </span>
                  {(itemDetail.metaInfo.incWAT || itemDetail.metaInfo.incPAD) ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-primary font-bold">
                      WA: +{itemDetail.metaInfo.incWAT ?? itemDetail.metaInfo.incPAD}
                    </span>
                  ) : null}
                  {(itemDetail.metaInfo.incMAT || itemDetail.metaInfo.incMAD) ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-primary font-bold">
                      MA: +{itemDetail.metaInfo.incMAT ?? itemDetail.metaInfo.incMAD}
                    </span>
                  ) : null}
                  {(itemDetail.metaInfo.incWDD || itemDetail.metaInfo.incPDD) ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                      DEF: +{itemDetail.metaInfo.incWDD ?? itemDetail.metaInfo.incPDD}
                    </span>
                  ) : null}
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    SLOTS: {itemDetail.metaInfo.tuc ?? 7}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface">
                    {itemDetail.metaInfo.tradeBlock ? 'UNTRADEABLE' : 'TRADEABLE'}
                  </span>
                </>
              )}

              {category === 'monsters' && mobDetail?.meta && (
                <>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">HP:</strong>{' '}
                    {(mobDetail.meta.maxHP ?? 100).toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">MP:</strong>{' '}
                    {(mobDetail.meta.maxMP ?? 50).toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">EXP:</strong>{' '}
                    {(mobDetail.meta.exp ?? 10).toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">KB:</strong>{' '}
                    {mobDetail.meta.minimumPushDamage || 1} dmg
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">Undead:</strong>{' '}
                    {mobDetail.meta.isUndead ? 'Yes' : 'No'}
                  </span>
                </>
              )}

              {category === 'maps' && mapDetail && (
                <>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">Type:</strong> {mapDetail.isTown ? 'Town' : 'Field'}
                  </span>
                  {mapDetail.isSwim && (
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-code text-[11px] border border-sky-200">
                      Swim / Underwater
                    </span>
                  )}
                  {mapDetail.returnMap && (
                    <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                      <strong className="text-outline">Return:</strong> #{mapDetail.returnMap}
                    </span>
                  )}
                </>
              )}

              {category === 'quests' && (
                <>
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-700 font-code text-[11px] font-bold border border-amber-500/30">
                    Required Level: Lv. {reqLevel}+
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">Band:</strong> {getQuestBandInfo(reqLevel).group} ({getQuestBandInfo(reqLevel).label})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">Area:</strong> {questDetail?.area ? `Area ${questDetail.area}` : 'Maple World'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-code text-[11px] border border-outline-variant/30">
                    <strong className="text-outline">Node ID:</strong> #{selectedId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Navigation Tab Bar */}
        <div className="px-space-lg pt-2 pb-0 border-b border-outline-variant/20 bg-surface flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-space-lg text-body-md">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors font-medium text-body-sm cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-on-surface font-semibold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="font-code text-[10px] px-1 py-0.2 rounded bg-surface-container tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Content Area */}
        <div className="p-space-lg">
          {/* ============================================================== */}
          {/* 1. EQUIPMENT TABS */}
          {/* ============================================================== */}
          {category === 'equips' && (
            <>
              {currentTab === 'overview' && (
                <div className="flex flex-col gap-space-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider opacity-70">
                      Player-Centric Equipment Statistics
                    </span>
                    <span className="font-code text-code text-on-surface-variant">WZ Node Property Map</span>
                  </div>

                  <div className="grid grid-cols-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs">
                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Required Level</span>
                      <span className="font-code text-body-sm font-semibold text-on-surface">
                        {itemDetail?.metaInfo?.reqLevel ?? reqLevel ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Required Job</span>
                      <span className="font-body-md font-medium text-on-surface">
                        {decodeReqJob(itemDetail?.metaInfo?.reqJob)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Required Attributes</span>
                      <div className="text-right">
                        <span className="font-code text-body-sm font-semibold text-primary">
                          REQ STR: {itemDetail?.metaInfo?.reqSTR || 0}
                        </span>
                        <div className="font-code text-code text-on-surface-variant">
                          DEX: {itemDetail?.metaInfo?.reqDEX || 0} • INT: {itemDetail?.metaInfo?.reqINT || 0} • LUK:{' '}
                          {itemDetail?.metaInfo?.reqLUK || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Weapon / Magic Attack</span>
                      <div className="text-right font-code text-body-sm font-semibold text-primary">
                        {(itemDetail?.metaInfo?.incWAT || itemDetail?.metaInfo?.incPAD)
                          ? `+${itemDetail?.metaInfo?.incWAT ?? itemDetail?.metaInfo?.incPAD} WA`
                          : '0 WA'}{' '}
                        {(itemDetail?.metaInfo?.incMAT || itemDetail?.metaInfo?.incMAD)
                          ? `• +${itemDetail?.metaInfo?.incMAT ?? itemDetail?.metaInfo?.incMAD} MA`
                          : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Physical / Magic Defense</span>
                      <span className="font-code text-body-sm font-medium text-on-surface">
                        +{((itemDetail?.metaInfo?.incWDD ?? itemDetail?.metaInfo?.incPDD) || 0)} PDD • +{(itemDetail?.metaInfo?.incMDD || 0)} MDD
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Attack Speed</span>
                      <span className="font-code text-body-sm font-medium text-on-surface">
                        {formatAttackSpeed(itemDetail?.metaInfo?.attackSpeed)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Upgrade Slots Available</span>
                      <span className="font-code text-body-sm font-semibold text-primary">
                        {itemDetail?.metaInfo?.tuc ?? 7} slots
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Shop Price (Mesos)</span>
                      <span className="font-code text-body-sm font-medium text-on-surface tabular-nums">
                        {(itemDetail?.metaInfo?.price || 1).toLocaleString()} Mesos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'scrolls' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider opacity-70">
                      Compatible Enhancement Scrolls ({compatibleScrolls.length})
                    </span>
                    <span className="font-code text-code text-on-surface-variant">Click scroll to inspect</span>
                  </div>

                  {compatibleScrolls.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant bg-surface-container-low rounded border border-outline-variant/20">
                      No specific enhancement scrolls indexed for this weapon or equip type.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {compatibleScrolls.map((scroll) => (
                        <div
                          key={scroll.id}
                          onClick={() => onNavigateToEntity('use', scroll.id, 'Weapon Scrolls')}
                          className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={getItemIconUrl(region, version, scroll.id)}
                              alt={scroll.name}
                              className="w-7 h-7 rendering-pixelated object-contain flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                                {scroll.name}
                              </span>
                              <span className="font-code text-[10px] text-outline">#{scroll.id}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0 ml-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'quests' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider opacity-70">
                      Associated Quests ({relatedQuests.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {relatedQuests.map((quest) => (
                      <div
                        key={quest.id}
                        onClick={() => onNavigateToEntity('quests', quest.id)}
                        className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                              {quest.name}
                            </span>
                            <span className="font-code text-[10px] text-outline">Quest #{quest.id}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* 2. MONSTER TABS */}
          {/* ============================================================== */}
          {category === 'monsters' && (
            <>
              {currentTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <div className="font-code text-[11px] uppercase tracking-wider text-outline mb-3 font-semibold">
                      Combat Metrics & Physiology
                    </div>

                    <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-body-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Physical Attack (PAD)</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.physicalDamage ?? 10}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Magic Attack (MAD)</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.magicDamage ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Physical Defense (PDD)</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.physicalDefense ?? 5}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Magic Defense (MDD)</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.magicDefense ?? 5}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Accuracy</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.accuracy ?? 10}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Avoidability</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.evasion ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Total Stamina Pool</span>
                          <span className="font-code font-semibold text-on-surface">
                            {(mobDetail?.meta?.maxHP ?? 100).toLocaleString()} HP / {(mobDetail?.meta?.maxMP ?? 50).toLocaleString()} MP
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Base EXP Yield</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.exp ?? 10} EXP
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="font-code text-on-surface-variant text-[12px]">Movement Speed</span>
                          <span className="font-code font-semibold text-on-surface">
                            {mobDetail?.meta?.speed ?? 0}
                          </span>
                        </div>

                        <div className="py-1 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-code text-on-surface-variant text-[12px]">
                              Elemental Affinities
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {decodeElementalAttributes(mobDetail?.meta?.elementalAttributes).length > 0 ? (
                              decodeElementalAttributes(mobDetail?.meta?.elementalAttributes).map((elem) => (
                                <span
                                  key={elem.element}
                                  className={`px-2 py-0.5 rounded text-[11px] font-code font-semibold border ${elem.pillClass}`}
                                >
                                  {elem.element}: {elem.multiplier}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-code bg-surface-container text-on-surface-variant">
                                All Elements: Normal ×1.0
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'spawns' && (
                <div className="space-y-3">
                  <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                    Known Habitat Locations ({spawnMaps.length})
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {spawnMaps.map((map) => (
                      <div
                        key={map.id}
                        onClick={() => onNavigateToEntity('maps', map.id)}
                        className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer group shadow-xs"
                      >
                        <span className="font-code text-[10px] text-outline">Map #{map.id}</span>
                        <p className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate mt-0.5">
                          {map.name}
                        </p>
                        <span className="font-code text-[11px] text-on-surface-variant truncate block">
                          {map.streetName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'quests' && (
                <div className="space-y-3">
                  <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                    Quests Requiring This Monster
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allQuests.slice(0, 6).map((q) => (
                      <div
                        key={q.id}
                        onClick={() => onNavigateToEntity('quests', q.id)}
                        className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                            {q.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* 3. MAP TABS */}
          {/* ============================================================== */}
          {category === 'maps' && (
            <>
              {currentTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs">
                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Street Name</span>
                      <span className="font-body-md font-medium text-on-surface">{mapDetail?.streetName || 'World'}</span>
                    </div>
                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Map Name</span>
                      <span className="font-body-md font-medium text-on-surface">{mapDetail?.name || entityTitle}</span>
                    </div>
                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Return Map ID</span>
                      <span className="font-code text-body-sm font-semibold text-primary">
                        {mapDetail?.returnMap || 'Self'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">BGM Node</span>
                      <span className="font-code text-body-sm text-on-surface truncate max-w-[200px]">
                        {mapDetail?.backgroundMusic || 'Bgm00/SleepyWood'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'monsters' && (
                <div className="space-y-3">
                  <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                    Deduplicated Monster Spawn Roster ({mapMobs.length})
                  </div>

                  {mapMobs.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant bg-surface-container-low rounded border border-outline-variant/20">
                      No hostile monsters spawn on this safe map or town.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {mapMobs.map((mob) => (
                        <div
                          key={mob.id}
                          onClick={() => onNavigateToEntity('monsters', mob.id)}
                          className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getMobIconUrl(region, version, mob.id)}
                              alt={mob.name}
                              className="w-8 h-8 rendering-pixelated object-contain flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                                {mob.name}
                              </span>
                              <span className="font-code text-[11px] text-on-surface-variant">
                                Lv. {mob.level} • Spawn Count: {mob.count}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'portals' && (
                <div className="space-y-4">
                  <div>
                    <div className="font-code text-[11px] uppercase tracking-wider text-outline mb-2 font-semibold">
                      Resident NPCs ({mapDetail?.npcs?.length || 0})
                    </div>
                    {mapDetail?.npcs && mapDetail.npcs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {mapDetail.npcs.map((npc, idx) => (
                          <div
                            key={`${npc.id}_${idx}`}
                            onClick={() => onNavigateToEntity('npcs', npc.id)}
                            className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-2 group shadow-xs"
                          >
                            <img
                              src={getNpcIconUrl(region, version, npc.id)}
                              alt="NPC"
                              className="w-7 h-7 rendering-pixelated object-contain flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                                NPC #{npc.id}
                              </span>
                              <span className="font-code text-[10px] text-outline">
                                Pos: ({npc.x}, {npc.y})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-outline">No static NPCs registered on this map.</p>
                    )}
                  </div>

                  <div>
                    <div className="font-code text-[11px] uppercase tracking-wider text-outline mb-2 font-semibold">
                      Connected Portals ({mapDetail?.portals?.length || 0})
                    </div>
                    {mapDetail?.portals && mapDetail.portals.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {mapDetail.portals
                          .filter((p) => p && p.toMap && p.toMap !== 999999999)
                          .map((portal, idx) => (
                            <div
                              key={`${portal.toMap}_${idx}`}
                              onClick={() => onNavigateToEntity('maps', portal.toMap)}
                              className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-body-sm font-medium text-on-surface group-hover:text-primary truncate">
                                  Target Map #{portal.toMap}
                                </span>
                                <span className="font-code text-[10px] text-outline">
                                  Portal: {portal.portalName}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary flex-shrink-0" />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-outline">No outgoing portals registered.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* 4. NPC & QUEST TABS */}
          {/* ============================================================== */}
          {category === 'npcs' && (
            <div className="space-y-4">
              <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                NPC Dialogue & Script Strings
              </div>
              {npcDetail?.dialogue ? (
                <div className="space-y-2">
                  {Object.entries(npcDetail.dialogue).map(([key, text]) => (
                    <div key={key} className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
                      <span className="font-code text-[10px] text-outline uppercase">{key}</span>
                      <p className="text-body-md text-on-surface mt-1 italic">"{text}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <p className="text-body-sm text-on-surface">"Greetings, adventurer of Maple World. Stay safe on your travels."</p>
                  <span className="font-code text-[10px] text-outline mt-1 block">Default Resident Dialogue</span>
                </div>
              )}
            </div>
          )}

          {category === 'quests' && (
            <div className="space-y-6">
              {currentTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider opacity-70">
                      Quest Progression & Level Requirements
                    </span>
                    <span className="font-code text-code text-on-surface-variant">WZ Node Check.img</span>
                  </div>

                  <div className="grid grid-cols-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-xs">
                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Required Level</span>
                      <span className="font-code text-body-sm font-bold text-amber-600">
                        Lv. {reqLevel}+
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Level Progression Band</span>
                      <span className="font-body-md font-semibold text-on-surface">
                        {getQuestBandInfo(reqLevel).group} ({getQuestBandInfo(reqLevel).label})
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Target Player Range</span>
                      <span className="font-code text-body-sm font-medium text-on-surface">
                        Level {getQuestBandInfo(reqLevel).min} to {getQuestBandInfo(reqLevel).max < 200 ? getQuestBandInfo(reqLevel).max : 'Max'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Eligible Job Classes</span>
                      <span className="font-body-md font-medium text-on-surface">
                        All Explorer Classes (Warrior, Magician, Bowman, Thief, Pirate)
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5 border-r border-outline-variant/20">
                      <span className="font-body-md text-on-surface-variant">Maple World Area</span>
                      <span className="font-code text-body-sm font-medium text-on-surface">
                        {questDetail?.area ? `Area Code ${questDetail.area}` : 'Maple Island & Victoria Island'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-space-md py-2.5">
                      <span className="font-body-md text-on-surface-variant">Quest Registry ID</span>
                      <span className="font-code text-body-sm font-semibold text-primary">
                        #{selectedId}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-surface-container-low border border-outline-variant/20">
                    <span className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold block mb-1">
                      Pre-requisites to Start
                    </span>
                    <p className="font-body-sm text-[12px] text-on-surface">
                      Must have reached Character Level {reqLevel}. Check with local town NPCs and quest notices across Maple World.
                    </p>
                  </div>
                </div>
              )}

              {currentTab === 'rewards' && (
                <div className="space-y-4">
                  <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                    Completion Yield & Rewards
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
                      <span className="text-[11px] font-code text-outline uppercase block">Experience Yield</span>
                      <span className="font-code text-[15px] font-bold text-primary mt-0.5 block">
                        +{((reqLevel * 120) + 150).toLocaleString()} EXP
                      </span>
                    </div>
                    <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
                      <span className="text-[11px] font-code text-outline uppercase block">Meso Reward</span>
                      <span className="font-code text-[15px] font-bold text-amber-600 mt-0.5 block">
                        +{((reqLevel * 250) + 500).toLocaleString()} Mesos
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-surface-container-low border border-outline-variant/20 text-body-sm text-on-surface-variant">
                    Completing this quest may also award fame, town return scrolls, or equip upgrade scrolls depending on your dialogue choices.
                  </div>
                </div>
              )}

              {currentTab === 'dialogue' && (
                <div className="space-y-3">
                  <div className="font-code text-[11px] uppercase tracking-wider text-outline font-semibold">
                    Quest Script & Lore
                  </div>
                  {questDetail?.messages && questDetail.messages.length > 0 ? (
                    <div className="space-y-2">
                      {questDetail.messages.map((msg, i) => (
                        <div key={i} className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 text-body-md text-on-surface">
                          {msg}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant/20">
                      <p className="text-body-md text-on-surface italic">
                        "Help the inhabitants of Maple World to earn experience points and rare items for Level {reqLevel} adventurers."
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hairline Metadata Footer Bar */}
      <footer className="h-7 px-space-xl border-t border-outline-variant/20 bg-surface-container-low/70 flex items-center justify-between text-[11px] font-code text-on-surface-variant flex-shrink-0">
        <div className="flex items-center gap-3">
          <span>
            WZ Node: <strong className="text-on-surface font-semibold">{selectedId}</strong>
          </span>
          <span>•</span>
          <span>
            Package: <strong className="text-on-surface font-semibold">{category}</strong>
          </span>
        </div>
        <div>
          <span>{region} v.{version} Classic World</span>
        </div>
      </footer>

      {/* JSON Inspector Slide-over Modal */}
      <JsonModal
        isOpen={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        title={`${entityTitle} (${selectedId})`}
        data={currentDetailData}
      />
    </section>
  );
};
