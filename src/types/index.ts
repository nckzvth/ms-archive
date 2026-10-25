export type RegistryCategory =
  | 'all'
  | 'equips'
  | 'use'
  | 'etc'
  | 'setup'
  | 'cash'
  | 'monsters'
  | 'maps'
  | 'npcs'
  | 'quests';

export interface WzVersion {
  isReady: boolean;
  hasImages: boolean;
  mapleVersionId: string;
  region: string;
}

export interface CategoryLeaf {
  item1: string; // name, e.g. "One-Handed Sword"
  item2: number; // low ID
  item3: number; // high ID
}

export interface RawCategoryTree {
  cash: Record<string, CategoryLeaf[]>;
  equip: Record<string, CategoryLeaf[]>;
  etc: Record<string, CategoryLeaf[]>;
  setup: Record<string, CategoryLeaf[]>;
  use: Record<string, CategoryLeaf[]>;
}

export interface TypeInfo {
  overallCategory?: string;
  category?: string;
  subCategory?: string;
  lowItemId?: number;
  highItemId?: number;
}

export interface ItemSummary {
  id: number;
  name: string;
  desc?: string;
  requiredLevel: number;
  requiredJobs?: string[];
  requiredGender?: number;
  isCash?: boolean;
  typeInfo?: TypeInfo;
}

export interface ItemDetailMeta {
  only?: boolean;
  cash?: boolean;
  reqLevel?: number;
  reqLevelEquip?: number;
  reqJob?: number;
  reqSTR?: number;
  reqDEX?: number;
  reqINT?: number;
  reqLUK?: number;
  incPAD?: number; // Weapon Attack
  incWAT?: number; // Weapon Attack (MCW)
  incMAD?: number; // Magic Attack
  incMAT?: number; // Magic Attack (MCW)
  incPDD?: number; // Weapon Defense
  incWDD?: number; // Weapon Defense (MCW)
  incMDD?: number; // Magic Defense
  incSTR?: number;
  incDEX?: number;
  incINT?: number;
  incLUK?: number;
  incSpeed?: number;
  incJump?: number;
  incACC?: number;
  incEVA?: number;
  incMHP?: number;
  incMMP?: number;
  attackSpeed?: number;
  tuc?: number; // Upgrades available
  price?: number;
  tradeBlock?: boolean;
  equipTradeBlock?: boolean;
  iconRaw?: string;
  icon?: string;
  iconOrigin?: { x: number; y: number };
  iconRawOrigin?: { x: number; y: number };
  success?: number;
  cursed?: number;
  recovery?: number;
  knockback?: number;
  [key: string]: unknown;
}

export interface ItemDetail {
  id: number;
  equipGroup?: string;
  description: {
    id: number;
    name: string;
    description: string;
  };
  metaInfo: ItemDetailMeta;
  typeInfo: TypeInfo;
  frameBooks?: Record<string, {
    frames: Array<{
      effects?: Record<string, {
        image?: string;
        origin?: { x: number; y: number };
        position?: string;
      }>;
    }>;
  }>;
}

export interface MobSummary {
  id: number;
  name: string;
  mobType?: string;
  level?: number;
  isBoss?: boolean;
  [key: string]: unknown;
}

export interface MobMeta {
  level: number;
  maxHP: number;
  maxMP: number;
  speed: number;
  physicalDamage: number;
  physicalDefense: number;
  magicDamage: number;
  magicDefense: number;
  accuracy: number;
  evasion: number;
  exp: number;
  isUndead?: boolean;
  isBodyAttack?: boolean;
  minimumPushDamage?: number;
  elementalAttributes?: string; // e.g. "H3" or "I2F3"
  summonType?: number;
  revivesMonsterId?: number[];
  [key: string]: unknown;
}

export interface MobDetail {
  id: number;
  name: string;
  description?: string;
  meta: MobMeta;
  framebooks: Record<string, number>;
  foundAt: number[];
}

export interface MapSummary {
  id: number;
  name: string;
  streetName: string;
}

export interface MapPortal {
  portalName: string;
  toName: string;
  toMap: number;
  x: number;
  y: number;
  isStarForcePortal?: boolean;
}

export interface MapNpcSpawn {
  id: number;
  x: number;
  y: number;
  name?: string;
  footholdId?: number;
}

export interface MapMobSpawn {
  id: number;
  name?: string;
  level?: number;
  count: number;
  x?: number;
  y?: number;
}

export interface MapDetail {
  id: number;
  name: string;
  streetName: string;
  backgroundMusic?: string;
  isTown?: boolean;
  isSwim?: boolean;
  returnMap?: number;
  returnMapName?: string;
  mobRate?: number;
  mobs?: Array<{ id: number; x?: number; y?: number }>;
  npcs?: MapNpcSpawn[];
  portals?: MapPortal[];
}

export interface NpcSummary {
  id: number;
  name: string;
}

export interface NpcDetail {
  id: number;
  name: string;
  dialogue?: Record<string, string>;
  foundAt?: number[];
  framebooks?: Record<string, number>;
  isShop?: boolean;
  relatedQuests?: number[];
}

export interface QuestSummary {
  id: number;
  name: string;
  area?: number;
  minLevel?: number;
  [key: string]: unknown;
}

export interface QuestLevelBand {
  id: string; // '1-10', '11-20', etc.
  label: string; // 'Lv. 1 - 10'
  group: string; // 'Beginner'
  min: number;
  max: number;
  count: number;
}

export const QUEST_LEVEL_BANDS: QuestLevelBand[] = [
  { id: '1-10', label: 'Lv. 1 - 10', group: 'Beginner', min: 1, max: 10, count: 46 },
  { id: '11-20', label: 'Lv. 11 - 20', group: 'Novice', min: 11, max: 20, count: 126 },
  { id: '21-30', label: 'Lv. 21 - 30', group: 'Apprentice', min: 21, max: 30, count: 64 },
  { id: '31-45', label: 'Lv. 31 - 45', group: 'Veteran', min: 31, max: 45, count: 44 },
  { id: '46-60', label: 'Lv. 46 - 60', group: 'Expert', min: 46, max: 60, count: 33 },
  { id: '61+', label: 'Lv. 61+', group: 'Master', min: 61, max: 999, count: 3 },
];

export function isQuestInBand(level: number, bandId: string): boolean {
  if (!bandId || bandId === 'All') return true;
  const band = QUEST_LEVEL_BANDS.find((b) => b.id === bandId);
  if (!band) return true;
  return level >= band.min && level <= band.max;
}

export function getQuestBandInfo(level: number): { label: string; group: string; min: number; max: number } {
  const found = QUEST_LEVEL_BANDS.find((b) => level >= b.min && level <= b.max);
  return found
    ? { label: found.label, group: found.group, min: found.min, max: found.max }
    : { label: `Lv. ${level}`, group: 'Adventurer', min: level, max: level };
}

export interface QuestRequirement {
  id?: number;
  npcId?: number;
  jobs?: number[];
  items?: Array<{ id: number; count: number }>;
  mobs?: Array<{ id: number; count: number }>;
  quests?: Array<{ id: number; state: number }>;
  levelMin?: number;
  levelMax?: number;
}

export interface QuestReward {
  exp?: number;
  meso?: number;
  fame?: number;
  items?: Array<{ id: number; count: number }>;
  [key: string]: unknown;
}

export interface QuestDetail {
  id: number;
  name: string;
  area?: number;
  minLevel?: number;
  messages?: string[];
  requirementToStart?: QuestRequirement;
  requirementToComplete?: QuestRequirement;
  rewardOnComplete?: QuestReward;
  rewardOnStart?: QuestReward;
  questsAvailableOnComplete?: Array<{ id: number; npcId?: number }>;
}

export interface BookmarkItem {
  id: number;
  name: string;
  category: RegistryCategory;
  subCategory?: string;
  subtitle?: string;
  timestamp: number;
}

export interface SearchEntity {
  id: string; // for MiniSearch: string id
  numericId: number;
  name: string;
  category: RegistryCategory;
  subCategory?: string;
  extra?: string;
}
