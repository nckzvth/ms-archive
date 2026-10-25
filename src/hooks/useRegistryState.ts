import { useState, useEffect, useCallback, useRef } from 'react';
import { RegistryCategory, BookmarkItem } from '../types';

export interface RegistryState {
  region: string;
  version: string;
  category: RegistryCategory;
  group: string;
  subCategory: string;
  selectedId: number | null;
  activeTab: string;
  filterPill: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
}

export function useRegistryState() {
  const readUrlState = useCallback((): RegistryState => {
    const params = new URLSearchParams(window.location.search);
    const category = (params.get('category') as RegistryCategory) || 'equips';
    const region = params.get('region') || 'MCW';
    const version = params.get('version') || '1';
    const group = params.get('group') || (category === 'equips' ? 'One-Handed' : '');
    const subCategory = params.get('sub') || (category === 'equips' ? 'One-Handed Sword' : '');
    const idParam = params.get('id');
    const selectedId = idParam ? parseInt(idParam, 10) : null;
    const activeTab = params.get('tab') || 'overview';
    const filterPill = params.get('filter') || 'All';
    const sortBy = params.get('sort') || 'name';
    const sortDirection = (params.get('dir') as 'asc' | 'desc') || 'asc';
    const searchQuery = params.get('q') || '';

    return {
      region,
      version,
      category,
      group,
      subCategory,
      selectedId,
      activeTab,
      filterPill,
      sortBy,
      sortDirection,
      searchQuery,
    };
  }, []);

  const [state, setState] = useState<RegistryState>(readUrlState);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to URL query parameters using replaceState to avoid history stack pollution
  const updateState = useCallback(
    (updater: Partial<RegistryState> | ((prev: RegistryState) => Partial<RegistryState>)) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? { ...prev, ...updater(prev) } : { ...prev, ...updater };

        // Debounce URL update to prevent UI stutter
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          const params = new URLSearchParams();
          if (next.region) params.set('region', next.region);
          if (next.version) params.set('version', next.version);
          if (next.category) params.set('category', next.category);
          if (next.group) params.set('group', next.group);
          if (next.subCategory) params.set('sub', next.subCategory);
          if (next.selectedId) params.set('id', next.selectedId.toString());
          if (next.activeTab && next.activeTab !== 'overview') params.set('tab', next.activeTab);
          if (next.filterPill && next.filterPill !== 'All') params.set('filter', next.filterPill);
          if (next.sortBy && next.sortBy !== 'name') params.set('sort', next.sortBy);
          if (next.sortDirection && next.sortDirection !== 'asc') params.set('dir', next.sortDirection);
          if (next.searchQuery) params.set('q', next.searchQuery);

          const newUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState(null, '', newUrl);
        }, 100);

        return next;
      });
    },
    []
  );

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setState(readUrlState());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [readUrlState]);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem('ms_archive_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = useCallback((item: BookmarkItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === item.id && b.category === item.category);
      const next = exists
        ? prev.filter((b) => !(b.id === item.id && b.category === item.category))
        : [item, ...prev];
      try {
        localStorage.setItem('ms_archive_bookmarks', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save bookmark:', err);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (id: number, category: RegistryCategory) => {
      return bookmarks.some((b) => b.id === id && b.category === category);
    },
    [bookmarks]
  );

  return {
    state,
    updateState,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  };
}
