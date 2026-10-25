import React, { useState } from 'react';
import { Copy, Check, X, Search } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, title, data }) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2) || '';
  const lines = jsonString.split('\n');
  const filteredLines = filter
    ? lines.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-10 px-4 bg-surface border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-code text-code text-on-surface-variant font-medium">RAW JSON INSPECTOR</span>
            <span className="text-outline-variant">/</span>
            <span className="font-code text-body-sm font-semibold text-primary truncate">{title}</span>
            <span className="font-code text-[11px] px-1.5 py-0.2 bg-surface-container rounded text-on-surface-variant">
              {lines.length} lines
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-code text-code transition-colors"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search filter bar */}
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Filter keys or values..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 bg-transparent font-code text-code text-on-surface placeholder:text-on-surface-variant/70 outline-none"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="font-code text-[10px] text-on-surface-variant hover:text-on-surface"
            >
              Clear
            </button>
          )}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-surface-container-lowest font-code text-[12px] leading-relaxed text-on-surface selection:bg-secondary-container">
          <pre className="m-0 whitespace-pre">
            {filteredLines.map((line, i) => (
              <div key={i} className="flex hover:bg-surface-container-low/50 px-1 py-0.5 rounded">
                <span className="w-12 text-right pr-4 text-outline select-none opacity-50 tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};
