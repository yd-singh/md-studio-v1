import React, { useState, useMemo } from 'react';
import { HeadingItem } from '../lib/markdownUtils';
import { ListOrdered, Search, Hash, X } from 'lucide-react';
import { clsx } from 'clsx';

interface TableOfContentsProps {
  headings: HeadingItem[];
  activeId: string | null;
  onSelectHeading: (id: string) => void;
  onClose?: () => void;
  textColor: string;
  borderColor: string;
  bgColor: string;
  codeBgColor: string;
}

export function TableOfContents({
  headings,
  activeId,
  onSelectHeading,
  onClose,
  textColor,
  borderColor,
  bgColor,
  codeBgColor,
}: TableOfContentsProps) {
  const [search, setSearch] = useState('');

  const filteredHeadings = useMemo(() => {
    if (!search.trim()) return headings;
    const q = search.toLowerCase();
    return headings.filter((h) => h.text.toLowerCase().includes(q));
  }, [headings, search]);

  return (
    <nav 
      aria-label="Table of Contents"
      className="flex flex-col h-full overflow-hidden text-xs rounded-2xl border shadow-xs"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      {/* Header */}
      <div 
        className="p-3 border-b flex items-center justify-between gap-2 shrink-0"
        style={{ borderColor, backgroundColor: codeBgColor }}
      >
        <div className="flex items-center gap-2 truncate">
          <ListOrdered className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[11px] truncate" style={{ color: textColor }}>
            Outline ({headings.length})
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/5 transition-colors"
            style={{ color: textColor }}
            title="Close Outline"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Filter if > 4 headings */}
      {headings.length > 4 && (
        <div className="p-2 border-b shrink-0" style={{ borderColor }}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter headings..."
              className="w-full pl-8 pr-2 py-1 rounded-lg border text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                borderColor,
                backgroundColor: bgColor,
                color: textColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredHeadings.map((heading) => {
          const isActive = activeId === heading.id;
          const indentClass = 
            heading.level === 1 ? 'pl-2 font-semibold' :
            heading.level === 2 ? 'pl-4' :
            heading.level === 3 ? 'pl-6 text-[11px]' :
            'pl-8 text-[11px]';

          return (
            <button
              key={heading.id}
              onClick={() => onSelectHeading(heading.id)}
              className={clsx(
                "w-full text-left py-1.5 pr-2 rounded-lg transition-all flex items-center gap-1.5 group",
                indentClass,
                isActive 
                  ? "bg-indigo-50/80 text-indigo-700 font-medium shadow-xs" 
                  : "hover:bg-black/5 opacity-80 hover:opacity-100"
              )}
              style={!isActive ? { color: textColor } : {}}
              title={heading.text}
            >
              <span className={clsx(
                "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                isActive 
                  ? "bg-indigo-600 scale-125" 
                  : "bg-slate-300 opacity-0 group-hover:opacity-60"
              )} />
              <Hash className="w-2.5 h-2.5 opacity-30 shrink-0" />
              <span className="truncate">{heading.text}</span>
            </button>
          );
        })}

        {headings.length === 0 && (
          <div className="p-4 text-center opacity-50 text-xs">
            No headings found in this document. Add # or ## headings to build an outline.
          </div>
        )}

        {headings.length > 0 && filteredHeadings.length === 0 && (
          <div className="p-4 text-center opacity-50 text-xs">
            No headings matching "{search}"
          </div>
        )}
      </div>
    </nav>
  );
}
