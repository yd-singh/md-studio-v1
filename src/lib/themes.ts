export type Theme = 'light' | 'matte' | 'glass' | 'dark' | 'neon' | 'tech' | 'custom';

export interface ThemeConfig {
  id: Theme;
  label: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  className: string;
  isDark?: boolean;
  isGlass?: boolean;
  variables: Record<string, string>;
}

export interface FontOption {
  id: string;
  label: string;
  sublabel: string;
  category: 'Tech' | 'Business' | 'Classic';
  fontBody: string;
  fontHeading: string;
}

export const fontOptions: FontOption[] = [
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    sublabel: 'Modern Clean UI',
    category: 'Business',
    fontBody: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontHeading: "'Plus Jakarta Sans', -apple-system, sans-serif",
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    sublabel: 'Developer Monospace',
    category: 'Tech',
    fontBody: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace",
    fontHeading: "'Space Grotesk', 'JetBrains Mono', monospace",
  },
  {
    id: 'grotesk',
    label: 'Space Grotesk',
    sublabel: 'Tech Display & Headings',
    category: 'Tech',
    fontBody: "'Space Grotesk', -apple-system, system-ui, sans-serif",
    fontHeading: "'Space Grotesk', sans-serif",
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    sublabel: 'Editorial Serif Paper',
    category: 'Business',
    fontBody: "'Merriweather', Georgia, 'Times New Roman', serif",
    fontHeading: "'Merriweather', serif",
  },
  {
    id: 'system',
    label: 'System UI',
    sublabel: 'Native OS Typography',
    category: 'Classic',
    fontBody: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontHeading: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
];

export const themes: ThemeConfig[] = [
  { 
    id: 'light', 
    label: 'Executive Light', 
    description: 'Crisp white paper with slate typography & indigo accents',
    accentColor: '#4f46e5',
    badgeBg: '#e0e7ff',
    className: 'theme-light',
    isDark: false,
    variables: {
      '--md-stage-bg': '#f1f5f9',
      '--md-bg': '#ffffff',
      '--md-text': '#1e293b',
      '--md-heading': '#0f172a',
      '--md-border': '#e2e8f0',
      '--md-code-bg': '#f8fafc',
      '--md-code-text': '#0f172a',
      '--md-link': '#4f46e5',
      '--md-blockquote-border': '#6366f1',
      '--md-blockquote-bg': '#f8fafc',
      '--md-blockquote-text': '#475569',
      '--md-table-header-bg': '#f8fafc',
      '--md-table-row-hover': '#f1f5f9',
      '--md-font-body': "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      '--md-font-heading': "'Plus Jakarta Sans', sans-serif",
    }
  },
  { 
    id: 'matte', 
    label: 'Matte View', 
    description: 'Velvety anti-glare charcoal sheet with soft stone borders',
    accentColor: '#818cf8',
    badgeBg: '#1f2430',
    className: 'theme-matte',
    isDark: true,
    variables: {
      '--md-stage-bg': '#0f1115',
      '--md-bg': '#191c22',
      '--md-text': '#d1d5db',
      '--md-heading': '#f3f4f6',
      '--md-border': '#2d323c',
      '--md-code-bg': '#14161b',
      '--md-code-text': '#e5e7eb',
      '--md-link': '#93c5fd',
      '--md-blockquote-border': '#6366f1',
      '--md-blockquote-bg': '#1e222b',
      '--md-blockquote-text': '#9ca3af',
      '--md-table-header-bg': '#15181e',
      '--md-table-row-hover': '#212630',
      '--md-font-body': "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      '--md-font-heading': "'Plus Jakarta Sans', sans-serif",
    }
  },
  { 
    id: 'glass', 
    label: 'Glass View', 
    description: 'Translucent frosted acrylic panel over ambient mesh stage',
    accentColor: '#0284c7',
    badgeBg: '#e0f2fe',
    className: 'theme-glass',
    isDark: false,
    isGlass: true,
    variables: {
      '--md-stage-bg': 'radial-gradient(circle at 50% 0%, #dbeafe 0%, #e0e7ff 50%, #f1f5f9 100%)',
      '--md-bg': 'rgba(255, 255, 255, 0.78)',
      '--md-text': '#0f172a',
      '--md-heading': '#0284c7',
      '--md-border': 'rgba(255, 255, 255, 0.8)',
      '--md-code-bg': 'rgba(241, 245, 249, 0.85)',
      '--md-code-text': '#0f172a',
      '--md-link': '#0284c7',
      '--md-blockquote-border': '#38bdf8',
      '--md-blockquote-bg': 'rgba(240, 249, 255, 0.75)',
      '--md-blockquote-text': '#334155',
      '--md-table-header-bg': 'rgba(241, 245, 249, 0.85)',
      '--md-table-row-hover': 'rgba(226, 232, 240, 0.6)',
      '--md-font-body': "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      '--md-font-heading': "'Plus Jakarta Sans', sans-serif",
    }
  },
  { 
    id: 'dark', 
    label: 'Obsidian Dark', 
    description: 'Deep slate midnight document with indigo highlights',
    accentColor: '#818cf8',
    badgeBg: '#1e293b',
    className: 'theme-dark',
    isDark: true,
    variables: {
      '--md-stage-bg': '#090d16',
      '--md-bg': '#0f172a',
      '--md-text': '#cbd5e1',
      '--md-heading': '#f8fafc',
      '--md-border': '#1e293b',
      '--md-code-bg': '#0a0f1d',
      '--md-code-text': '#e2e8f0',
      '--md-link': '#818cf8',
      '--md-blockquote-border': '#6366f1',
      '--md-blockquote-bg': '#131c31',
      '--md-blockquote-text': '#94a3b8',
      '--md-table-header-bg': '#0a0f1d',
      '--md-table-row-hover': '#1e293b',
      '--md-font-body': "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      '--md-font-heading': "'Plus Jakarta Sans', sans-serif",
    }
  },
  { 
    id: 'neon', 
    label: 'Cyber Neon', 
    description: 'Pitch terminal canvas with glowing electric cyan & emerald',
    accentColor: '#22d3ee',
    badgeBg: '#083344',
    className: 'theme-neon',
    isDark: true,
    variables: {
      '--md-stage-bg': '#04060a',
      '--md-bg': '#080b12',
      '--md-text': '#cbd5e1',
      '--md-heading': '#22d3ee',
      '--md-border': '#162235',
      '--md-code-bg': '#030712',
      '--md-code-text': '#34d399',
      '--md-link': '#38bdf8',
      '--md-blockquote-border': '#06b6d4',
      '--md-blockquote-bg': '#0b1322',
      '--md-blockquote-text': '#94a3b8',
      '--md-table-header-bg': '#0b1322',
      '--md-table-row-hover': '#131e33',
      '--md-font-body': "'JetBrains Mono', 'Space Grotesk', monospace",
      '--md-font-heading': "'Space Grotesk', 'JetBrains Mono', monospace",
    }
  },
  { 
    id: 'tech', 
    label: 'JetBrains Dev', 
    description: 'JetBrains IDE dark theme with code keyword highlights',
    accentColor: '#ffc66d',
    badgeBg: '#2b2d30',
    className: 'theme-tech',
    isDark: true,
    variables: {
      '--md-stage-bg': '#141517',
      '--md-bg': '#1e1f22',
      '--md-text': '#bcbec4',
      '--md-heading': '#ffc66d',
      '--md-border': '#393b40',
      '--md-code-bg': '#2b2d30',
      '--md-code-text': '#6aab73',
      '--md-link': '#56a8f5',
      '--md-blockquote-border': '#56a8f5',
      '--md-blockquote-bg': '#26282e',
      '--md-blockquote-text': '#8b949e',
      '--md-table-header-bg': '#26282e',
      '--md-table-row-hover': '#2f3136',
      '--md-font-body': "'JetBrains Mono', 'Fira Code', monospace",
      '--md-font-heading': "'Space Grotesk', 'JetBrains Mono', monospace",
    }
  },
  { 
    id: 'custom', 
    label: 'Custom Theme', 
    description: 'Customized palette and styles configured via visual editor',
    accentColor: '#6366f1',
    badgeBg: '#e0e7ff',
    className: 'theme-custom',
    variables: {
      '--md-stage-bg': '#f1f5f9',
      '--md-bg': '#ffffff',
      '--md-text': '#000000',
      '--md-heading': '#000000',
      '--md-border': '#cccccc',
      '--md-code-bg': '#eeeeee',
      '--md-code-text': '#000000',
      '--md-link': '#0000ee',
      '--md-blockquote-border': '#999999',
      '--md-blockquote-bg': '#ffffff',
      '--md-blockquote-text': '#666666',
      '--md-table-header-bg': '#f9f9f9',
      '--md-table-row-hover': '#eeeeee',
      '--md-font-body': "'Plus Jakarta Sans', sans-serif",
      '--md-font-heading': "'Plus Jakarta Sans', sans-serif",
    }
  },
];
