import React, { useState } from 'react';
import { X, Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { BookmarkItem, RegistryCategory } from '../../types';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onSelect: (item: BookmarkItem) => void;
  onRemove: (item: BookmarkItem) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSelect,
  onRemove,
}) => {
  const [filterCat, setFilterCat] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = filterCat === 'all'
    ? bookmarks
    : bookmarks.filter((b) => b.category === filterCat);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-[360px] h-full bg-surface-container-lowest border-l border-outline-variant/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-150">
        {/* Drawer Header */}
        <div className="h-10 px-4 bg-surface border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600" />
            <span className="font-headline-sm text-body-sm text-primary font-semibold">Bookmarks</span>
            <span className="font-code text-[11px] px-1.5 py-0.2 bg-surface-container rounded text-on-surface-variant">
              {bookmarks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-1.5 border-b border-outline-variant/20 bg-surface-container-low flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['all', 'equips', 'monsters', 'maps', 'npcs', 'quests'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-label-sm uppercase transition-colors whitespace-nowrap ${
                filterCat === cat
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15 p-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant font-body-sm">
              <Bookmark className="w-8 h-8 text-outline-variant mx-auto mb-2 opacity-50" />
              <p className="font-medium text-body-sm">No saved bookmarks</p>
              <p className="text-[12px] text-outline mt-1 px-6">
                Click the bookmark icon in the inspector header to save entities here for quick access.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={`${item.category}_${item.id}`}
                className="p-2 rounded hover:bg-surface-container-low transition-colors flex items-center justify-between group"
              >
                <div
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex flex-col min-w-0 flex-1 cursor-pointer pr-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-body-sm text-on-surface truncate group-hover:text-primary">
                      {item.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-1.5 font-code text-[11px] text-on-surface-variant">
                    <span className="text-outline uppercase text-[10px]">{item.category}</span>
                    <span>•</span>
                    <span className="tabular-nums">#{item.id}</span>
                    {item.subCategory && (
                      <>
                        <span>•</span>
                        <span className="truncate">{item.subCategory}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item);
                  }}
                  className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-colors opacity-70 group-hover:opacity-100"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
