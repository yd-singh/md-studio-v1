import React, { useState } from 'react';
import { themes, ThemeConfig, fontOptions } from '../lib/themes';
import { X, Save, Type } from 'lucide-react';

interface CustomThemeEditorProps {
  onClose: () => void;
  onSave: (config: ThemeConfig) => void;
  initialConfig?: ThemeConfig;
}

export const CustomThemeEditor: React.FC<CustomThemeEditorProps> = ({ onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState<ThemeConfig>(initialConfig || themes.find(t => t.id === 'custom')!);

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value
      }
    }));
  };

  const handleFontSelect = (fontId: string) => {
    const selected = fontOptions.find(f => f.id === fontId);
    if (!selected) return;
    setConfig(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        '--md-font-body': selected.fontBody,
        '--md-font-heading': selected.fontHeading
      }
    }));
  };

  const labels: Record<string, string> = {
    '--md-bg': 'Background Color',
    '--md-text': 'Text Color',
    '--md-heading': 'Heading Color',
    '--md-border': 'Border Color',
    '--md-code-bg': 'Code Block Background',
    '--md-code-text': 'Code Text Color',
    '--md-link': 'Link Color',
    '--md-blockquote-border': 'Blockquote Border',
    '--md-blockquote-bg': 'Blockquote Background',
    '--md-blockquote-text': 'Blockquote Text',
    '--md-table-header-bg': 'Table Header Background',
    '--md-table-row-hover': 'Table Row Hover',
  };

  // Find currently matched font option
  const currentFontOption = fontOptions.find(
    f => f.fontBody === config.variables['--md-font-body']
  ) || fontOptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Customize Theme & Typography</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Font Family Selector */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-indigo-600" />
              <label className="text-sm font-semibold text-slate-900">Document Typography Style</label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Choose from specialized Tech, Business, and Classic font families:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {fontOptions.map((font) => {
                const isSelected = currentFontOption.id === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleFontSelect(font.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-slate-900 block" style={{ fontFamily: font.fontBody }}>
                        {font.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {font.sublabel || font.fontBody.split(',')[0].replace(/'/g, '')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      font.category === 'Tech' 
                        ? 'bg-purple-100 text-purple-700'
                        : font.category === 'Business'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {font.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color pickers */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Theme Colors</h4>
            {Object.entries(config.variables).map(([key, value]) => {
              if (!labels[key]) return null;
              return (
                <div key={key} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700 flex-1">{labels[key]}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase">{value}</span>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 overflow-hidden"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(config); onClose(); }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
