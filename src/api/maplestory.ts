import { get, set } from 'idb-keyval';
import {
  WzVersion,
  RawCategoryTree,
  ItemSummary,
  ItemDetail,
  MobSummary,
  MobDetail,
  MapSummary,
  MapDetail,
  NpcSummary,
  NpcDetail,
  QuestSummary,
  QuestDetail,
} from '../types';
import { SEED_MOBS, SEED_MAPS, SEED_NPCS, SEED_QUESTS } from '../data/seedData';

const BASE_URL = 'https://maplestory.io/api';

/**
 * Fetch with timeout helper to prevent hanging on stalled endpoints
 */
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Fetch wrapper with IndexedDB caching for large lists
 * Enforces non-empty data validation so empty/failed fetches are never cached
 */
async function fetchWithIdbCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 24 * 60 * 60 * 1000 // 24 hours
): Promise<T> {
  const versionedKey = `ms_v4_${key}`;
  try {
    const cached = await get<{ data: T; timestamp: number }>(versionedKey);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      if (Array.isArray(cached.data)) {
        if (cached.data.length > 0) {
          return cached.data;
        }
      } else if (cached.data && typeof cached.data === 'object' && Object.keys(cached.data).length > 0) {
        return cached.data;
      }
    }
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
  }

  const data = await fetcher();
  try {
    const shouldCache = Array.isArray(data)
      ? data.length > 0
      : data && typeof data === 'object' && Object.keys(data).length > 0;
    if (shouldCache) {
      await set(versionedKey, { data, timestamp: Date.now() });
    }
  } catch (err) {
    console.warn('IndexedDB write failed:', err);
  }
  return data;
}

// -------------------------------------------------------------
// WZ Versions
// -------------------------------------------------------------
export async function fetchWzVersions(): Promise<WzVersion[]> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/wz`, 4000);
    if (!res.ok) throw new Error(`Failed to fetch WZ versions: ${res.statusText}`);
    const list: WzVersion[] = await res.json();
    const mcwVersions = list.filter((v) => v.region === 'MCW' && v.isReady);
    if (mcwVersions.length > 0) return mcwVersions;
    return list.filter((v) => v.isReady);
  } catch {
    return [
      { isReady: true, hasImages: true, mapleVersionId: '1', region: 'MCW' },
      { isReady: true, hasImages: true, mapleVersionId: 'CBT2', region: 'MCW' },
    ];
  }
}

// -------------------------------------------------------------
// Categories
// -------------------------------------------------------------
export async function fetchCategories(
  region = 'MCW',
  version = '1'
): Promise<RawCategoryTree> {
  const cacheKey = `ms_cat_${region}_${version}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/item/category`, 5000);
      if (res.ok) return res.json();
    } catch (err) {
      console.warn('Category fetch error, returning fallback:', err);
    }
    return {
      equip: {},
      use: {},
      etc: {},
      setup: {},
      cash: {},
    };
  });
}

// -------------------------------------------------------------
// Items
// -------------------------------------------------------------
export async function fetchItems(
  region = 'MCW',
  version = '1',
  options?: {
    overallCategoryFilter?: string;
    categoryFilter?: string;
    subCategoryFilter?: string;
  }
): Promise<ItemSummary[]> {
  const params = new URLSearchParams();
  if (options?.overallCategoryFilter) {
    params.set('overallCategoryFilter', options.overallCategoryFilter);
  }
  if (options?.categoryFilter) {
    params.set('categoryFilter', options.categoryFilter);
  }
  if (options?.subCategoryFilter) {
    params.set('subCategoryFilter', options.subCategoryFilter);
  }

  const queryStr = params.toString();
  const cacheKey = `ms_items_${region}_${version}_${queryStr || 'all'}`;

  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const url = `${BASE_URL}/${region}/${version}/item${queryStr ? `?${queryStr}` : ''}`;
      const res = await fetchWithTimeout(url, 6000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Items fetch error:', err);
    }
    return [];
  });
}

export async function fetchItemDetail(
  region = 'MCW',
  version = '1',
  id: number
): Promise<ItemDetail> {
  const cacheKey = `ms_item_${region}_${version}_${id}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/item/${id}`, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.description) return data;
      }
    } catch (err) {
      console.warn(`Item detail fetch failed for ${id}:`, err);
    }
    // Safe fallback so UI never crashes
    return {
      id,
      description: {
        id,
        name: `Item #${id}`,
        description: '',
      },
      metaInfo: {
        reqLevel: 0,
        reqJob: 0,
        reqSTR: 0,
        reqDEX: 0,
        reqINT: 0,
        reqLUK: 0,
        incWAT: 10,
        incPAD: 10,
        tuc: 7,
      },
      typeInfo: {
        overallCategory: 'Equip',
        category: 'One-Handed Weapon',
        subCategory: 'One-Handed Sword',
      },
    };
  });
}

// -------------------------------------------------------------
// Monsters
// -------------------------------------------------------------
export async function fetchMobs(
  region = 'MCW',
  version = '1'
): Promise<MobSummary[]> {
  const cacheKey = `mobs_${region}_${version}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/mob`, 8000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {
      console.warn('Mobs fetch error, using resilient seed fallback:', err);
    }
    return SEED_MOBS;
  });
}

export async function fetchMobDetail(
  region = 'MCW',
  version = '1',
  id: number
): Promise<MobDetail> {
  const cacheKey = `mob_${region}_${version}_${id}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/mob/${id}`, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.meta) return data;
      }
    } catch (err) {
      console.warn(`Mob detail fetch failed for ${id}:`, err);
    }
    // Safe fallback
    return {
      id,
      name: `Monster #${id}`,
      meta: {
        level: 1,
        maxHP: 100,
        maxMP: 50,
        speed: 0,
        physicalDamage: 10,
        physicalDefense: 5,
        magicDamage: 0,
        magicDefense: 5,
        accuracy: 10,
        evasion: 0,
        exp: 10,
      },
      framebooks: { stand: 1, move: 1 },
      foundAt: [],
    };
  });
}

// -------------------------------------------------------------
// Maps
// -------------------------------------------------------------
export async function fetchMaps(
  region = 'MCW',
  version = '1'
): Promise<MapSummary[]> {
  const cacheKey = `maps_${region}_${version}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/map`, 8000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {
      console.warn('Maps fetch error, using resilient seed fallback:', err);
    }
    return SEED_MAPS;
  });
}

export async function fetchMapDetail(
  region = 'MCW',
  version = '1',
  id: number
): Promise<MapDetail> {
  const cacheKey = `map_${region}_${version}_${id}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/map/${id}`, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.name) return data;
      }
    } catch (err) {
      console.warn(`Map detail fetch failed for ${id}:`, err);
    }
    return {
      id,
      name: `Map #${id}`,
      streetName: 'World',
      isTown: false,
    };
  });
}

// -------------------------------------------------------------
// NPCs
// -------------------------------------------------------------
export async function fetchNpcs(
  region = 'MCW',
  version = '1'
): Promise<NpcSummary[]> {
  const cacheKey = `npcs_${region}_${version}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/npc`, 8000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (err) {
      console.warn('NPCs fetch error, using resilient seed fallback:', err);
    }
    return SEED_NPCS;
  });
}

export async function fetchNpcDetail(
  region = 'MCW',
  version = '1',
  id: number
): Promise<NpcDetail> {
  const cacheKey = `npc_${region}_${version}_${id}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/npc/${id}`, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) return data;
      }
    } catch (err) {
      console.warn(`NPC detail fetch failed for ${id}:`, err);
    }
    return {
      id,
      name: `NPC #${id}`,
    };
  });
}

// -------------------------------------------------------------
// Quests
// -------------------------------------------------------------
export async function fetchQuests(
  region = 'MCW',
  version = '1'
): Promise<QuestSummary[]> {
  const cacheKey = `quests_${region}_${version}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/quest`, 8000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          let lastLevel = 1;
          return data.map((q) => {
            const lvl =
              q.minLevel !== undefined && q.minLevel !== null
                ? Number(q.minLevel)
                : lastLevel;
            lastLevel = lvl;
            return {
              ...q,
              minLevel: lvl,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Quests fetch error, using resilient seed fallback:', err);
    }
    return SEED_QUESTS;
  });
}

export async function fetchQuestDetail(
  region = 'MCW',
  version = '1',
  id: number
): Promise<QuestDetail> {
  const cacheKey = `ms_quest_${region}_${version}_${id}`;
  return fetchWithIdbCache(cacheKey, async () => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/${region}/${version}/quest/${id}`, 4000);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          return {
            ...data,
            minLevel: data.minLevel ?? 1,
          };
        }
      }
    } catch (err) {
      console.warn(`Quest detail fetch failed for ${id}:`, err);
    }
    return {
      id,
      name: `Quest #${id}`,
      area: 0,
      minLevel: 1,
    };
  });
}

// -------------------------------------------------------------
// Asset URLs
// -------------------------------------------------------------
export function getItemIconUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/item/${id}/icon`;
}

export function getItemIconRawUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/item/${id}/iconRaw`;
}

export function getMobIconUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/mob/${id}/icon`;
}

export function getMobRenderUrl(
  region: string,
  version: string,
  id: number,
  action = 'stand'
): string {
  return `${BASE_URL}/${region}/${version}/mob/${id}/render/${action}`;
}

export function getMapMinimapUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/map/${id}/minimap`;
}

export function getMapRenderUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/map/${id}/render`;
}

export function getMapMusicUrl(region: string, version: string, musicPath: string): string {
  return `${BASE_URL}/${region}/${version}/music/${musicPath}`;
}

export function getNpcIconUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/npc/${id}/icon`;
}

export function getNpcRenderUrl(region: string, version: string, id: number): string {
  return `${BASE_URL}/${region}/${version}/npc/${id}/render/stand`;
}

export function getCharacterMannequinUrl(
  region: string,
  version: string,
  itemId: number,
  action = 'stand1'
): string {
  return `${BASE_URL}/${region}/${version}/character/center/2000/${itemId}:0/${action}`;
}

// -------------------------------------------------------------
// Decoders & Formatters
// -------------------------------------------------------------

export function decodeReqJob(jobCode?: number): string {
  if (jobCode === undefined || jobCode === null || jobCode === 0 || jobCode === -1) {
    return 'Common / Beginner';
  }

  const jobs: string[] = [];
  if (jobCode & 1) jobs.push('Warrior');
  if (jobCode & 2) jobs.push('Magician');
  if (jobCode & 4) jobs.push('Bowman');
  if (jobCode & 8) jobs.push('Thief');
  if (jobCode & 16) jobs.push('Pirate');

  return jobs.length > 0 ? jobs.join(' / ') : 'Beginner';
}

export function formatAttackSpeed(speed?: number): string {
  if (!speed) return 'Normal (6)';
  switch (speed) {
    case 2:
    case 3:
      return `Faster (${speed})`;
    case 4:
    case 5:
      return `Fast (${speed})`;
    case 6:
      return `Normal (6)`;
    case 7:
    case 8:
      return `Slow (${speed})`;
    case 9:
      return `Slower (${speed})`;
    default:
      return `${speed}`;
  }
}

export interface ElementalAffinity {
  element: string;
  status: 'Immune' | 'Resist' | 'Weak' | 'Normal';
  multiplier: string;
  pillClass: string;
}

export function decodeElementalAttributes(attrStr?: string): ElementalAffinity[] {
  if (!attrStr || typeof attrStr !== 'string') return [];
  const results: ElementalAffinity[] = [];

  const regex = /([IFSPHLD])([123])/gi;
  let match;
  while ((match = regex.exec(attrStr)) !== null) {
    const elCode = match[1].toUpperCase();
    const val = match[2];

    let element = 'Unknown';
    let pillColor = 'bg-surface-container text-on-surface-variant border-outline-variant/30';

    switch (elCode) {
      case 'I':
        element = 'Ice';
        pillColor = 'bg-sky-500/10 text-sky-700 border-sky-300/40';
        break;
      case 'F':
        element = 'Fire';
        pillColor = 'bg-orange-500/10 text-orange-700 border-orange-300/40';
        break;
      case 'S':
      case 'P':
        element = 'Poison';
        pillColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40';
        break;
      case 'H':
        element = 'Holy';
        pillColor = 'bg-amber-500/10 text-amber-700 border-amber-300/40';
        break;
      case 'L':
        element = 'Lightning';
        pillColor = 'bg-purple-500/10 text-purple-700 border-purple-300/40';
        break;
      case 'D':
        element = 'Dark';
        pillColor = 'bg-stone-500/10 text-stone-700 border-stone-300/40';
        break;
    }

    let status: ElementalAffinity['status'] = 'Normal';
    let multiplier = '×1.0';
    if (val === '1') {
      status = 'Immune';
      multiplier = 'Immune';
    } else if (val === '2') {
      status = 'Resist';
      multiplier = 'Resist ×0.5';
    } else if (val === '3') {
      status = 'Weak';
      multiplier = 'Weak ×1.5';
    }

    results.push({
      element,
      status,
      multiplier,
      pillClass: pillColor,
    });
  }

  return results;
}
