import React, { useState, useRef, useEffect } from 'react';
import { Type, ChevronDown, Check } from 'lucide-react';
import { fontOptions, FontOption } from '../lib/themes';

interface FontDropdownProps {
  selectedFontId: string;
  onSelectFont: (fontId: string) => void;
  textColor?: string;
  borderColor?: string;
  bgColor?: string;
}

export const FontDropdown: React.FC<FontDropdownProps> = ({
  selectedFontId,
  onSelectFont,
  textColor,
  borderColor,
  bgColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeFont = fontOptions.find((f) => f.id === selectedFontId) || fontOptions[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all hover:bg-black/5 active:scale-98 shadow-2xs"
        style={{
          color: textColor,
          borderColor: borderColor || 'rgba(0,0,0,0.1)',
          backgroundColor: bgColor || 'transparent',
        }}
        title="Select Document Typography"
      >
        <Type className="w-3.5 h-3.5 opacity-70" />
        <span 
          className="font-semibold" 
          style={{ fontFamily: activeFont.fontBody }}
        >
          {activeFont.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Document Typography
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
              Live Preview
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {fontOptions.map((font) => {
              const isSelected = selectedFontId === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    onSelectFont(font.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-start justify-between group ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium ring-1 ring-indigo-500/20'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      {/* Font name rendered in its own actual font! */}
                      <span 
                        className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white"
                        style={{ fontFamily: font.fontBody }}
                      >
                        {font.label}
                      </span>
                      <span 
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          font.category === 'Tech'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : font.category === 'Business'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {font.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {font.sublabel}
                    </p>

                    {/* Specimen sample rendered in its actual font */}
                    <p 
                      className="text-xs text-slate-600 dark:text-slate-300 mt-1 opacity-80 select-none"
                      style={{ fontFamily: font.fontBody }}
                    >
                      Sphinx of black quartz, judge my vow. 0123456789
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
