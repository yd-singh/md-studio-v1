import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  ArrowLeft, Download, Printer, FileCode, Edit2, Eye, Copy, Check, 
  Share2, Maximize2, Minimize2, FileText, Settings, AlignJustify, 
  Columns, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Search, FolderArchive, Loader2, ListOrdered, BookOpen, Clock, Sparkles
} from 'lucide-react';
import 'highlight.js/styles/github.css';
import { themes, Theme, ThemeConfig, fontOptions, FontOption } from '../lib/themes';
import { clsx } from 'clsx';
import { Mermaid } from './Mermaid';
import { CodeBlock } from './CodeBlock';
import { CustomThemeEditor } from './CustomThemeEditor';
import { TableOfContents } from './TableOfContents';
import { ReadingTimeBadge } from './ReadingTimeBadge';
import { ThemeDropdown } from './ThemeDropdown';
import { FontDropdown } from './FontDropdown';
import { parseHeadings, calculateMetrics, slugify, extractText } from '../lib/markdownUtils';
import { exportMarkdownToPdf } from '../lib/pdfExport';

export interface FolderFileInfo {
  path: string;
  name: string;
}

interface DocumentPreviewProps {
  content: string;
  fileName: string;
  onBack: () => void;
  folderFiles?: FolderFileInfo[];
  currentFilePath?: string;
  onNavigateToFile?: (path: string) => void;
  onContentChange?: (content: string) => void;
}

function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const segments = normalized.split('/');
  segments.pop();
  return segments.join('/');
}

export function DocumentPreview({ 
  content: initialContent, 
  fileName, 
  onBack,
  folderFiles,
  currentFilePath,
  onNavigateToFile,
  onContentChange
}: DocumentPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isEditing, setIsEditing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isWide, setIsWide] = useState(true);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [customThemeConfig, setCustomThemeConfig] = useState<ThemeConfig | null>(null);
  const [selectedFontId, setSelectedFontId] = useState<string>('jakarta');

  const activeFont = useMemo(() => {
    return fontOptions.find(f => f.id === selectedFontId) || fontOptions[0];
  }, [selectedFontId]);

  // Sync content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  const isFolderMode = Boolean(folderFiles && folderFiles.length > 0 && onNavigateToFile);

  // Parse headings for Table of Contents
  const headings = useMemo(() => parseHeadings(content), [content]);

  // Calculate word count, char count, reading time
  const metrics = useMemo(() => calculateMetrics(content), [content]);

  // Lookup map for fast internal file linking
  const folderPathLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (!folderFiles) return map;
    for (const file of folderFiles) {
      const normalized = normalizePath(file.path).replace(/^\//, '');
      map.set(normalized, file.path);
      map.set(normalized.toLowerCase(), file.path);
      const basename = normalized.split('/').pop() || normalized;
      if (!map.has(basename.toLowerCase())) {
        map.set(basename.toLowerCase(), file.path);
      }
    }
    return map;
  }, [folderFiles]);

  const resolveInternalFile = useCallback((rawHref: string): string | null => {
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('mailto:')) {
      return null;
    }
    const cleanHref = rawHref.split('?')[0].split('#')[0];
    if (!cleanHref) return null;

    if (folderPathLookup.has(cleanHref)) return folderPathLookup.get(cleanHref)!;
    if (folderPathLookup.has(cleanHref.toLowerCase())) return folderPathLookup.get(cleanHref.toLowerCase())!;

    if (currentFilePath) {
      const baseDir = dirname(currentFilePath);
      const combined = baseDir ? `${baseDir}/${cleanHref}` : cleanHref;
      const normalized = normalizePath(combined);
      if (folderPathLookup.has(normalized)) return folderPathLookup.get(normalized)!;
      if (folderPathLookup.has(normalized.toLowerCase())) return folderPathLookup.get(normalized.toLowerCase())!;
    }

    const basename = cleanHref.split('/').pop() || cleanHref;
    if (folderPathLookup.has(basename.toLowerCase())) return folderPathLookup.get(basename.toLowerCase())!;

    return null;
  }, [folderPathLookup, currentFilePath]);

  const activeThemeConfig: ThemeConfig = useMemo(() => {
    let base: ThemeConfig;
    if (currentTheme === 'custom' && customThemeConfig) {
      base = customThemeConfig;
    } else {
      base = themes.find(t => t.id === currentTheme) || themes[0];
    }
    return {
      ...base,
      variables: {
        ...base.variables,
        '--md-font-body': activeFont.fontBody,
        '--md-font-heading': activeFont.fontHeading,
      }
    };
  }, [currentTheme, customThemeConfig, activeFont]);

  // Set CSS variables on body
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(activeThemeConfig.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    if (activeThemeConfig.isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    return () => {
      Object.keys(activeThemeConfig.variables).forEach(([key]) => {
        root.style.removeProperty(key);
      });
      document.body.classList.remove('dark');
    };
  }, [activeThemeConfig]);

  // Scroll spy to highlight active heading in TOC
  useEffect(() => {
    if (!isTocOpen || headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            setActiveHeadingId(headings[i].id);
            return;
          }
        }
      }
      if (headings.length > 0) {
        setActiveHeadingId(headings[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTocOpen, headings]);

  const handleSelectHeading = (id: string) => {
    setActiveHeadingId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleThemeChange = (themeId: Theme) => {
    setCurrentTheme(themeId);
    if (themeId !== 'custom') {
      setCustomThemeConfig(null);
    }
  };

  const handleCustomThemeSave = (config: ThemeConfig) => {
    setCustomThemeConfig(config);
    setCurrentTheme('custom');
  };

  // Filtered files for explorer sidebar
  const filteredFolderFiles = useMemo(() => {
    if (!folderFiles) return [];
    if (!explorerSearch.trim()) return folderFiles;
    const q = explorerSearch.toLowerCase();
    return folderFiles.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
  }, [folderFiles, explorerSearch]);

  const currentFolderIndex = useMemo(() => {
    if (!folderFiles || !currentFilePath) return -1;
    return folderFiles.findIndex(f => f.path === currentFilePath);
  }, [folderFiles, currentFilePath]);

  const goToPrevFile = () => {
    if (folderFiles && currentFolderIndex > 0 && onNavigateToFile) {
      onNavigateToFile(folderFiles[currentFolderIndex - 1].path);
    }
  };

  const goToNextFile = () => {
    if (folderFiles && currentFolderIndex >= 0 && currentFolderIndex < folderFiles.length - 1 && onNavigateToFile) {
      onNavigateToFile(folderFiles[currentFolderIndex + 1].path);
    }
  };

  const handleCopyHtml = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current.innerHTML);
      setCopied(true);
      setCopyMessage('Copied HTML!');
      setTimeout(() => {
        setCopied(false);
        setCopyMessage(null);
      }, 2000);
    }
  };

  const handleExportGoogleDocs = async () => {
    if (!contentRef.current) return;
    try {
      const clone = contentRef.current.cloneNode(true) as HTMLElement;

      // 1. Remove interactive UI elements like copy buttons, toolbars, etc.
      clone.querySelectorAll('button').forEach(btn => btn.remove());

      // 2. Replace Mermaid diagram containers with the raw Mermaid code in a styled pre block
      const mermaidContainers = clone.querySelectorAll('[data-role="mermaid-container"]');
      mermaidContainers.forEach(container => {
        const code = container.getAttribute('data-mermaid-code') || '';
        const pre = document.createElement('pre');
        pre.className = 'mermaid-code';
        pre.setAttribute(
          'style',
          'font-family: Consolas, "Courier New", Courier, monospace; background-color: #f8fafc; color: #0f172a; padding: 14px; border-radius: 6px; border: 1px solid #cbd5e1; white-space: pre-wrap; word-break: break-word; margin: 16px 0; font-size: 13px; line-height: 1.5;'
        );
        const codeEl = document.createElement('code');
        codeEl.textContent = code;
        pre.appendChild(codeEl);

        container.replaceWith(pre);
      });

      // Cleanup any dangling diagram SVGs if any
      clone.querySelectorAll('.mermaid-diagram').forEach(diagram => {
        if (clone.contains(diagram)) {
          diagram.remove();
        }
      });

      const processedHtml = clone.innerHTML;
      const plainText = clone.innerText;

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const blobHtml = new Blob([processedHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }

      setCopied(true);
      setCopyMessage('Copied for Google Docs!');
      setTimeout(() => {
        setCopied(false);
        setCopyMessage(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy for Google Docs:', err);
      if (contentRef.current) {
        navigator.clipboard.writeText(contentRef.current.innerText);
        setCopied(true);
        setCopyMessage('Copied text!');
        setTimeout(() => {
          setCopied(false);
          setCopyMessage(null);
        }, 2000);
      }
    }
  };

  const handleDownloadHtml = () => {
    if (!contentRef.current) return;
    const activeClass = themes.find(t => t.id === currentTheme)?.className || '';
    const styleVariables = Object.entries(activeThemeConfig.variables)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName.replace(/\.md$/, '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      ${styleVariables}
    }
    body {
      background-color: var(--md-bg);
      color: var(--md-text);
      font-family: var(--md-font-body);
      line-height: 1.6;
      padding: 2rem;
      max-width: 52rem;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--md-font-heading);
      color: var(--md-heading);
    }
    a { color: var(--md-link); text-decoration: underline; }
    blockquote { border-left: 4px solid var(--md-quote-border); color: var(--md-quote-text); padding-left: 1rem; margin: 1.5rem 0; font-style: italic; }
    code { background: var(--md-code-bg); padding: 0.2em 0.4em; border-radius: 4px; font-family: var(--md-font-code); font-size: 0.85em; }
    pre { background: var(--md-code-bg); padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid var(--md-border); }
    pre code { background: transparent; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    th, td { border: 1px solid var(--md-border); padding: 0.5rem 1rem; }
    th { background: var(--md-code-bg); }
    hr { border: 0; border-top: 1px solid var(--md-border); margin: 2rem 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body class="${activeClass}">
  <main class="markdown-content">
    ${contentRef.current.innerHTML}
  </main>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.md$/, '')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setIsGeneratingPdf(true);

    try {
      await exportMarkdownToPdf({
        contentElement: contentRef.current,
        fileName,
        themeConfig: activeThemeConfig,
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isDarkMode = activeThemeConfig.isDark;

  // Heading component helper with anchor slug IDs
  const createHeading = (Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    return ({ children, ...props }: any) => {
      const text = extractText(children);
      const id = slugify(text);
      return (
        <Tag 
          id={id} 
          {...props} 
          className={clsx("group relative scroll-mt-24", props.className)}
          style={{ fontFamily: activeFont.fontHeading, ...props.style }}
        >
          {children}
        </Tag>
      );
    };
  };

  return (
    <div 
      className={clsx(
        "min-h-screen flex flex-col transition-colors duration-200",
        activeThemeConfig.className
      )}
      style={{
        background: activeThemeConfig.variables['--md-stage-bg'] || activeThemeConfig.variables['--md-bg'],
        color: activeThemeConfig.variables['--md-text'],
      }}
    >
      {/* Top Navigation & Toolbar */}
      <div 
        className="sticky top-0 z-20 border-b backdrop-blur-md px-3 sm:px-6 py-2.5 no-print transition-colors"
        style={{
          backgroundColor: activeThemeConfig.isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: activeThemeConfig.variables['--md-border'],
        }}
      >
        <div className={clsx("mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3", (isWide || isFolderMode || isTocOpen) ? "max-w-7xl" : "max-w-5xl")}>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 transition-colors font-medium text-xs sm:text-sm px-2.5 py-1.5 rounded-lg hover:bg-black/5"
              style={{ color: activeThemeConfig.variables['--md-text'] }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <div className="h-4 w-px" style={{ backgroundColor: activeThemeConfig.variables['--md-border'] }} />
            
            {/* Folder Explorer Toggle */}
            {isFolderMode && (
              <button
                onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                  !isExplorerCollapsed
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                    : "hover:bg-black/5 border-transparent"
                )}
                style={isExplorerCollapsed ? { color: activeThemeConfig.variables['--md-text'] } : {}}
                title={isExplorerCollapsed ? "Open Folder Explorer" : "Hide Folder Explorer"}
              >
                {isExplorerCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Files</span>
              </button>
            )}

            {/* Prev / Next navigation for folder mode */}
            {isFolderMode && folderFiles && (
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevFile}
                  disabled={currentFolderIndex <= 0}
                  className="p-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
                  style={{ borderColor: activeThemeConfig.variables['--md-border'], color: activeThemeConfig.variables['--md-text'] }}
                  title="Previous Markdown File"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1.5 opacity-60" style={{ color: activeThemeConfig.variables['--md-text'] }}>
                  {currentFolderIndex + 1}/{folderFiles.length}
                </span>
                <button
                  onClick={goToNextFile}
                  disabled={currentFolderIndex < 0 || currentFolderIndex >= folderFiles.length - 1}
                  className="p-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
                  style={{ borderColor: activeThemeConfig.variables['--md-border'], color: activeThemeConfig.variables['--md-text'] }}
                  title="Next Markdown File"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Table of Contents (TOC) Toggle */}
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                isTocOpen 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                  : "hover:bg-black/5 border-transparent"
              )}
              style={!isTocOpen ? { color: activeThemeConfig.variables['--md-text'] } : {}}
              title={isTocOpen ? "Hide Outline (TOC)" : "Show Outline (TOC)"}
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
              <span>Outline</span>
              {headings.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100/80 text-indigo-800">
                  {headings.length}
                </span>
              )}
            </button>

            {/* Reading Time & Word Count Badge */}
            <ReadingTimeBadge 
              metrics={metrics} 
              textColor={activeThemeConfig.variables['--md-text']}
              borderColor={activeThemeConfig.variables['--md-border']}
              bgColor={activeThemeConfig.variables['--md-code-bg']}
            />

            <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: activeThemeConfig.variables['--md-border'] }} />

            {/* Edit Mode Toggle */}
            <button
              onClick={() => {
                setIsEditing((prev) => {
                  const next = !prev;
                  if (next) setIsWide(true);
                  return next;
                });
              }}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors border",
                isEditing 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                  : "hover:bg-black/5 border-transparent"
              )}
              style={!isEditing ? { color: activeThemeConfig.variables['--md-text'] } : {}}
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>

            {isEditing && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                  isFullScreen
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "hover:bg-black/5 border-transparent"
                )}
                style={!isFullScreen ? { color: activeThemeConfig.variables['--md-text'] } : {}}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen Editor"}
              >
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isFullScreen ? 'Exit' : 'Full Screen'}</span>
              </button>
            )}

            <button
              onClick={() => setIsWide(!isWide)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                isWide
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "hover:bg-black/5 border-transparent"
              )}
              style={!isWide ? { color: activeThemeConfig.variables['--md-text'] } : {}}
              title={isWide ? "Switch to Narrow View" : "Switch to Wide View"}
            >
              {isWide ? <AlignJustify className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isWide ? 'Wide' : 'Narrow'}</span>
            </button>
          </div>

          {/* Typography, Theme Dropdowns, Badge, and Export */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end w-full md:w-auto">
            {/* Font Dropdown */}
            <FontDropdown 
              selectedFontId={selectedFontId}
              onSelectFont={setSelectedFontId}
              textColor={activeThemeConfig.variables['--md-text']}
              borderColor={activeThemeConfig.variables['--md-border']}
              bgColor={activeThemeConfig.variables['--md-code-bg']}
            />

            {/* Theme Dropdown */}
            <ThemeDropdown 
              currentTheme={currentTheme}
              onSelectTheme={handleThemeChange}
              onOpenCustomEditor={() => setShowThemeEditor(true)}
              textColor={activeThemeConfig.variables['--md-text']}
              borderColor={activeThemeConfig.variables['--md-border']}
              bgColor={activeThemeConfig.variables['--md-code-bg']}
            />

            {/* Vibed by Yash Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shadow-2xs"
              style={{
                backgroundColor: activeThemeConfig.variables['--md-code-bg'],
                borderColor: activeThemeConfig.variables['--md-border'],
                color: activeThemeConfig.variables['--md-link'] || '#4f46e5'
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vibed by Yash</span>
            </div>

            <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: activeThemeConfig.variables['--md-border'] }} />

            {/* Share / Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                disabled={isGeneratingPdf}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors shadow-xs disabled:opacity-60",
                  copyMessage ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : copyMessage ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>{isGeneratingPdf ? 'Exporting...' : copyMessage || 'Export'}</span>
              </button>

              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 text-slate-700">
                  <button
                    onClick={() => { handleExportGoogleDocs(); setShowShareMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Copy for Google Docs</span>
                  </button>
                  
                  <button
                    onClick={() => { handleCopyHtml(); setShowShareMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copied ? 'Copied!' : 'Copy HTML Code'}</span>
                  </button>

                  <button
                    onClick={() => { handleDownloadHtml(); setShowShareMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <FileCode className="w-4 h-4 text-orange-600" />
                    <span>Download HTML File</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => { handleDownloadPdf(); setShowShareMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Download className="w-4 h-4 text-red-600" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => { handlePrint(); setShowShareMenu(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Printer className="w-4 h-4 text-slate-800" />
                    <span>Print Document</span>
                  </button>
                </div>
              )}

              {showShareMenu && (
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowShareMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Path Breadcrumb Bar if in folder mode */}
      {isFolderMode && currentFilePath && (
        <div 
          className="border-b px-4 py-1.5 text-xs flex items-center gap-2 no-print"
          style={{ 
            borderColor: activeThemeConfig.variables['--md-border'],
            backgroundColor: activeThemeConfig.variables['--md-code-bg'],
            color: activeThemeConfig.variables['--md-text']
          }}
        >
          <FolderArchive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="opacity-60">File:</span>
          <span className="font-mono font-medium truncate">{currentFilePath}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className={clsx(
        "flex-1 w-full mx-auto print:p-0 print:block transition-all duration-300",
        isEditing
          ? (isFullScreen ? "max-w-none h-[calc(100vh-60px)] p-0" : "max-w-7xl h-[calc(100vh-90px)] p-3 sm:p-5")
          : ((isWide || isFolderMode || isTocOpen) ? "max-w-7xl p-3 sm:p-5 lg:p-6" : "max-w-4xl p-3 sm:p-6 lg:p-8")
      )}>
        <div className={clsx(
          "h-full min-h-0",
          // Determine grid layout based on sidebars: Outline on the left
          isFolderMode && isTocOpen && !isEditing
            ? (isExplorerCollapsed 
                ? "grid grid-cols-1 lg:grid-cols-[56px_260px_minmax(0,1fr)] gap-4 items-start" 
                : "grid grid-cols-1 lg:grid-cols-[240px_240px_minmax(0,1fr)] gap-4 items-start")
            : isFolderMode && !isEditing
            ? (isExplorerCollapsed
                ? "grid grid-cols-1 lg:grid-cols-[56px_minmax(0,1fr)] gap-4 items-start"
                : "grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4 items-start")
            : isTocOpen && !isEditing
            ? "grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start"
            : ""
        )}>
          {/* File Explorer Sidebar in Folder Mode */}
          {isFolderMode && folderFiles && !isEditing && (
            <aside
              className="no-print rounded-2xl border flex flex-col overflow-hidden shadow-xs lg:sticky lg:top-16 max-h-[calc(100vh-100px)]"
              style={{ 
                borderColor: activeThemeConfig.variables['--md-border'], 
                backgroundColor: activeThemeConfig.variables['--md-bg'] 
              }}
            >
              {/* Explorer Header */}
              <div
                className="p-3 border-b text-xs font-semibold uppercase tracking-wider flex items-center justify-between gap-2 shrink-0"
                style={{ 
                  borderColor: activeThemeConfig.variables['--md-border'], 
                  color: activeThemeConfig.variables['--md-text'],
                  backgroundColor: activeThemeConfig.variables['--md-code-bg']
                }}
              >
                {!isExplorerCollapsed && (
                  <div className="flex items-center gap-2 truncate">
                    <FolderArchive className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate text-[11px]">Files ({folderFiles.length})</span>
                  </div>
                )}
                <button
                  onClick={() => setIsExplorerCollapsed((prev) => !prev)}
                  className="p-1 rounded-md hover:bg-black/5 transition-colors"
                  title={isExplorerCollapsed ? 'Expand File Explorer' : 'Collapse File Explorer'}
                  style={{ color: activeThemeConfig.variables['--md-text'] }}
                >
                  {isExplorerCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
              </div>

              {!isExplorerCollapsed && (
                <>
                  {/* Search / Filter input */}
                  <div className="p-2 border-b shrink-0" style={{ borderColor: activeThemeConfig.variables['--md-border'] }}>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                      <input
                        type="text"
                        value={explorerSearch}
                        onChange={(e) => setExplorerSearch(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-8 pr-2 py-1 rounded-lg border text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        style={{
                          borderColor: activeThemeConfig.variables['--md-border'],
                          backgroundColor: activeThemeConfig.variables['--md-bg'],
                          color: activeThemeConfig.variables['--md-text']
                        }}
                      />
                    </div>
                  </div>

                  {/* File List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {filteredFolderFiles.map((file, idx) => {
                      const isActive = file.path === currentFilePath;
                      return (
                        <button
                          key={file.path}
                          onClick={() => onNavigateToFile?.(file.path)}
                          className={clsx(
                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 group",
                            isActive ? "font-semibold shadow-xs" : "hover:bg-black/5 opacity-85 hover:opacity-100"
                          )}
                          style={{
                            color: activeThemeConfig.variables['--md-text'],
                            backgroundColor: isActive ? activeThemeConfig.variables['--md-code-bg'] : 'transparent',
                          }}
                          title={file.path}
                        >
                          <span className="opacity-40 text-[10px] font-mono shrink-0 w-3.5 text-right">
                            {idx + 1}.
                          </span>
                          <span className="truncate">{file.path}</span>
                        </button>
                      );
                    })}
                    {filteredFolderFiles.length === 0 && (
                      <p className="p-3 text-center text-xs opacity-50">No matching markdown files</p>
                    )}
                  </div>
                </>
              )}
            </aside>
          )}

          {/* Table of Contents (TOC) Sidebar on the LEFT in Preview Mode */}
          {isTocOpen && !isEditing && (
            <aside 
              className="no-print lg:sticky lg:top-16 max-h-[calc(100vh-100px)]"
            >
              <TableOfContents
                headings={headings}
                activeId={activeHeadingId}
                onSelectHeading={handleSelectHeading}
                onClose={() => setIsTocOpen(false)}
                textColor={activeThemeConfig.variables['--md-text']}
                borderColor={activeThemeConfig.variables['--md-border']}
                bgColor={activeThemeConfig.variables['--md-bg']}
                codeBgColor={activeThemeConfig.variables['--md-code-bg']}
              />
            </aside>
          )}

          {/* Main Content Area: Split Editor or Document View */}
          <div className={clsx(
            "min-h-0 min-w-0", 
            isEditing ? "grid grid-cols-1 lg:grid-cols-2 gap-4 h-full" : ""
          )}>
            {/* Editor Pane */}
            {isEditing && (
              <div className="h-full flex flex-col no-print">
                <div 
                  className="rounded-t-xl border-b-0 p-2.5 flex justify-between items-center"
                  style={{ 
                    backgroundColor: activeThemeConfig.variables['--md-code-bg'],
                    borderColor: activeThemeConfig.variables['--md-border'],
                    borderWidth: '1px',
                    borderBottom: 'none'
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: activeThemeConfig.variables['--md-text'], opacity: 0.7 }}>
                    Markdown Source
                  </span>
                  <span className="text-[11px] font-mono opacity-50" style={{ color: activeThemeConfig.variables['--md-text'] }}>
                    {metrics.wordCount} words • {content.length} chars
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => handleContentUpdate(e.target.value)}
                  className={clsx(
                    "flex-1 w-full p-4 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed",
                    isFullScreen ? "rounded-none border-0" : "rounded-b-xl border"
                  )}
                  style={{ 
                    backgroundColor: activeThemeConfig.variables['--md-bg'],
                    color: activeThemeConfig.variables['--md-text'],
                    borderColor: activeThemeConfig.variables['--md-border']
                  }}
                  placeholder="Type your markdown here..."
                />
              </div>
            )}

            {/* Preview Pane */}
            <div className={clsx(
              "print:w-full min-w-0",
              isEditing ? "h-full overflow-y-auto" : ""
            )}>
              {isEditing && (
                <div 
                  className={clsx("border-b-0 p-2.5 mb-0 sticky top-0 z-10", isFullScreen ? "border-0 border-b" : "rounded-t-xl border")}
                  style={{ 
                    backgroundColor: activeThemeConfig.variables['--md-code-bg'],
                    borderColor: activeThemeConfig.variables['--md-border']
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: activeThemeConfig.variables['--md-text'], opacity: 0.7 }}>
                    Live Preview
                  </span>
                </div>
              )}
              
              <article 
                ref={contentRef}
                className={clsx(
                  "shadow-md border p-6 sm:p-10 md:p-12 print:shadow-none print:border-0 print:p-0 markdown-content transition-all duration-200",
                  themes.find(t => t.id === currentTheme)?.className,
                  isEditing ? (isFullScreen ? "rounded-none border-0 min-h-full" : "rounded-b-xl border-t-0 min-h-[calc(100%-40px)]") : "rounded-2xl"
                )}
                style={{
                  backgroundColor: activeThemeConfig.variables['--md-bg'],
                  color: activeThemeConfig.variables['--md-text'],
                  borderColor: activeThemeConfig.variables['--md-border'],
                  fontFamily: activeFont.fontBody,
                }}
              >
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: createHeading('h1'),
                    h2: createHeading('h2'),
                    h3: createHeading('h3'),
                    h4: createHeading('h4'),
                    h5: createHeading('h5'),
                    h6: createHeading('h6'),
                    a({ href, children, ...props }: any) {
                      const targetPath = resolveInternalFile(href);
                      if (targetPath && onNavigateToFile) {
                        return (
                          <a
                            href={href}
                            {...props}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigateToFile(targetPath);
                            }}
                            className={clsx('cursor-pointer underline decoration-dotted font-medium text-indigo-600 hover:text-indigo-800', props.className)}
                            title={`Open ${targetPath}`}
                          >
                            {children}
                          </a>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                          {children}
                        </a>
                      );
                    },
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isMermaid = match && match[1] === 'mermaid';
                      
                      if (!inline && isMermaid) {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} isDark={isDarkMode} />;
                      }

                      return !inline && match ? (
                        <div className="relative group my-4">
                          <CodeBlock className={className} {...props}>
                            {children}
                          </CodeBlock>
                        </div>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      </div>

      {showThemeEditor && (
        <CustomThemeEditor
          onClose={() => setShowThemeEditor(false)}
          onSave={handleCustomThemeSave}
          initialConfig={customThemeConfig || undefined}
        />
      )}
    </div>
  );
}
