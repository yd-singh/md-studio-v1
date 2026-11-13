import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Check, Settings, Sparkles } from 'lucide-react';
import { themes, Theme, ThemeConfig } from '../lib/themes';

interface ThemeDropdownProps {
  currentTheme: Theme;
  onSelectTheme: (themeId: Theme) => void;
  onOpenCustomEditor: () => void;
  textColor?: string;
  borderColor?: string;
  bgColor?: string;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  currentTheme,
  onSelectTheme,
  onOpenCustomEditor,
  textColor,
  borderColor,
  bgColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find((t) => t.id === currentTheme) || themes[0];

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
        title="Select Theme"
      >
        <span
          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs shrink-0"
          style={{ backgroundColor: activeTheme.accentColor }}
        />
        <Palette className="w-3.5 h-3.5 opacity-70" />
        <span className="font-semibold">{activeTheme.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Visual Theme
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
              {themes.length} styles
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {themes.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start gap-3 group ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full mt-0.5 border shadow-2xs shrink-0 flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ 
                      backgroundColor: theme.variables['--md-bg'] || '#ffffff',
                      borderColor: theme.accentColor
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{theme.label}</span>
                      {theme.isGlass && (
                        <span className="px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                          Glass
                        </span>
                      )}
                      {theme.id === 'matte' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Anti-Glare
                        </span>
                      )}
                      {theme.id === 'neon' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Neon
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {theme.description}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCustomEditor();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Customize Colors & Theme...</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider opacity-60">Customizer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
