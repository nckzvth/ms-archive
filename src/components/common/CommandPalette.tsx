import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft, Shield, Sparkles, MapPin, User, FileText } from 'lucide-react';
import { searchGlobal } from '../../services/search';
import { SearchEntity, RegistryCategory } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: SearchEntity) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute fuzzy search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const found = searchGlobal(query, 40);
    setResults(found);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: RegistryCategory) => {
    switch (cat) {
      case 'equips':
      case 'use':
      case 'etc':
      case 'setup':
      case 'cash':
        return <Shield className="w-3.5 h-3.5 text-on-surface-variant" />;
      case 'monsters':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
      case 'maps':
        return <MapPin className="w-3.5 h-3.5 text-sky-600" />;
      case 'npcs':
        return <User className="w-3.5 h-3.5 text-emerald-600" />;
      case 'quests':
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Search className="w-3.5 h-3.5 text-outline" />;
    }
  };

  const getCategoryBadge = (cat: RegistryCategory) => {
    const labels: Record<RegistryCategory, string> = {
      all: 'All',
      equips: 'Equip',
      use: 'Use',
      etc: 'Etc',
      setup: 'Setup',
      cash: 'Cash',
      monsters: 'Mob',
      maps: 'Map',
      npcs: 'NPC',
      quests: 'Quest',
    };
    return labels[cat] || cat;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="h-12 px-4 flex items-center gap-3 border-b border-outline-variant/20 bg-surface">
          <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, monsters, maps, NPCs, quests by name or ID..."
            className="flex-1 bg-transparent font-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-code text-on-surface-variant shadow-xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto divide-y divide-outline-variant/10 p-1"
        >
          {query.trim() && results.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-body-sm">
              <p>No results found for "{query}"</p>
              <span className="text-[11px] text-outline font-code">
                Try searching by exact numeric ID or a shorter name prefix
              </span>
            </div>
          ) : !query.trim() ? (
            <div className="py-8 px-4 text-center text-on-surface-variant">
              <span className="font-headline-sm text-body-sm text-on-surface">Quick Spotlight Search</span>
              <p className="font-body-sm text-[12px] text-outline mt-1">
                Type an item name (e.g. "Zakum", "Red Katana"), a monster (e.g. "Jr. Boogie", "Snail"), or an ID.
              </p>
            </div>
          ) : (
            results.map((entity, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${entity.category}_${entity.numericId}_${index}`}
                  onClick={() => {
                    onSelect(entity);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`h-11 px-3 flex items-center justify-between rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-surface-container-high text-primary font-medium'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0">{getCategoryIcon(entity.category)}</span>
                    <span className="text-body-sm truncate">{entity.name}</span>
                    {entity.subCategory && (
                      <span className="text-[11px] text-on-surface-variant truncate font-code">
                        • {entity.subCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <span className="font-code text-[11px] text-outline tabular-nums">
                      #{entity.numericId}
                    </span>
                    <span className="font-code text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                      {getCategoryBadge(entity.category)}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-on-surface-variant opacity-70 ml-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="h-8 px-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-between text-[11px] font-code text-on-surface-variant select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.2 bg-surface-container-lowest rounded border border-outline-variant/30 mr-1">
                ↑
              </kbd>
              <kbd className="px-1 py-0.2 bg-surface-container-lowest rounded border border-outline-variant/30 mr-1">
                ↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.2 bg-surface-container-lowest rounded border border-outline-variant/30 mr-1">
                ↵
              </kbd>
              Open
            </span>
          </div>
          <span className="text-outline">MiniSearch 60fps</span>
        </div>
      </div>
    </div>
  );
};
