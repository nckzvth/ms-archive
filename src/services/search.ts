import MiniSearch from 'minisearch';
import { SearchEntity } from '../types';

let miniSearchInstance: MiniSearch<SearchEntity> | null = null;
const indexedIds = new Set<string>();

function getMiniSearch(): MiniSearch<SearchEntity> {
  if (!miniSearchInstance) {
    miniSearchInstance = new MiniSearch<SearchEntity>({
      fields: ['name', 'id', 'subCategory', 'extra'],
      storeFields: ['numericId', 'name', 'category', 'subCategory', 'extra'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { name: 2, id: 3 },
      },
    });
  }
  return miniSearchInstance;
}

export function indexEntities(entities: SearchEntity[]): void {
  const ms = getMiniSearch();
  const toAdd = entities.filter((e) => !indexedIds.has(e.id));
  if (toAdd.length > 0) {
    ms.addAll(toAdd);
    toAdd.forEach((e) => indexedIds.add(e.id));
  }
}

export function searchGlobal(query: string, limit = 50): SearchEntity[] {
  if (!query.trim()) return [];
  const ms = getMiniSearch();
  try {
    const results = ms.search(query);
    return results.slice(0, limit).map((r) => ({
      id: r.id,
      numericId: r.numericId,
      name: r.name,
      category: r.category,
      subCategory: r.subCategory,
      extra: r.extra,
    }));
  } catch (err) {
    console.error('MiniSearch error:', err);
    return [];
  }
}

export function clearSearchIndex(): void {
  miniSearchInstance = null;
  indexedIds.clear();
}
