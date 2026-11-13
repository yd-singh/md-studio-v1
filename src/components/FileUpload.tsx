import React, { useCallback, useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, AlertCircle, Type, FolderArchive, FolderOpen, 
  Loader2, Github, FileArchive, ArrowRight, Sparkles 
} from 'lucide-react';
import { clsx } from 'clsx';
import { parseGitHubUrl, fetchGitHubRepoMarkdown, unpackZipArchive } from '../lib/remoteLoaders';

export interface FolderItem {
  path: string;
  name: string;
  content: string;
}

interface FileUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onFolderLoaded?: (files: FolderItem[], title?: string) => void;
  initialMode?: 'paste' | 'file' | 'folder' | 'github' | 'zip';
}

export type Tab = 'paste' | 'file' | 'folder' | 'github' | 'zip';

const GITHUB_PRESETS = [
  { label: 'MD-Viewer', url: 'yd-singh/MD-Viewer' },
  { label: 'React Docs', url: 'facebook/react' },
  { label: 'Gitignore Specs', url: 'github/gitignore' },
];

export function FileUpload({ onFileLoaded, onFolderLoaded, initialMode = 'paste' }: FileUploadProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialMode);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [githubInput, setGithubInput] = useState('');

  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Set webkitdirectory & directory attributes on the folder input
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, [activeTab]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processSingleMarkdownFile = useCallback((file: File) => {
    setError(null);
    const validExtensions = ['.md', '.markdown', '.txt'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Please upload a valid Markdown (.md, .markdown, .txt) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      onFileLoaded(content, file.name);
    };
    reader.onerror = () => {
      setError('Error reading file.');
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  const processZipFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Decompressing ZIP archive...');

    try {
      const items = await unpackZipArchive(file, (status) => {
        setProcessingStatus(status);
      });

      if (onFolderLoaded) {
        const archiveName = file.name.replace(/\.zip$/i, '');
        onFolderLoaded(items, archiveName);
      } else {
        onFileLoaded(items[0].content, items[0].name);
      }
    } catch (err: any) {
      console.error('ZIP unpack error:', err);
      setError(err.message || 'Failed to unpack ZIP file.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Recursively read directory entries from drag-and-drop
  const readEntryRecursive = async (entry: any, basePath = ''): Promise<{ path: string; file: File }[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          const relativePath = basePath ? `${basePath}/${file.name}` : file.name;
          resolve([{ path: relativePath, file }]);
        }, () => resolve([]));
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const entries: any[] = [];
        let batch: any[];
        do {
          batch = await new Promise((res) => dirReader.readEntries(res, () => res([])));
          entries.push(...batch);
        } while (batch.length > 0);
        return entries;
      };

      const childEntries = await readAllEntries();
      const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const nested = await Promise.all(
        childEntries.map((child) => readEntryRecursive(child, currentPath))
      );
      return nested.flat();
    }
    return [];
  };

  const processFolderFiles = async (fileEntries: { path: string; file: File }[]) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Indexing markdown files in folder...');

    const validExtensions = ['.md', '.markdown', '.txt'];
    const markdownFiles = fileEntries.filter((item) =>
      validExtensions.some((ext) => item.file.name.toLowerCase().endsWith(ext))
    );

    if (markdownFiles.length === 0) {
      setError('No valid Markdown (.md, .markdown, .txt) files found in this folder.');
      setIsProcessing(false);
      return;
    }

    try {
      const parsedItems: FolderItem[] = await Promise.all(
        markdownFiles.map(async (item) => {
          const text = await item.file.text();
          return {
            path: item.path,
            name: item.file.name,
            content: text,
          };
        })
      );

      // Sort files: README first, then alphabetically
      parsedItems.sort((a, b) => {
        const aIsReadme = /(^|\/)readme\.md$/i.test(a.path);
        const bIsReadme = /(^|\/)readme\.md$/i.test(b.path);
        if (aIsReadme && !bIsReadme) return -1;
        if (!aIsReadme && bIsReadme) return 1;
        return a.path.localeCompare(b.path);
      });

      if (onFolderLoaded) {
        onFolderLoaded(parsedItems);
      } else {
        onFileLoaded(parsedItems[0].content, parsedItems[0].name);
      }
    } catch (err) {
      console.error('Failed reading folder files:', err);
      setError('An error occurred while reading the folder files.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (!files || files.length === 0) return;

    // 1. Check if dropped file is a ZIP archive
    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      await processZipFile(files[0]);
      return;
    }

    // 2. Check if user dropped a folder or multiple files
    if (items && items.length > 0) {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      const hasDirectory = entries.some((entry) => entry.isDirectory);

      if (hasDirectory || entries.length > 1) {
        setIsProcessing(true);
        try {
          const fileList = await Promise.all(entries.map((entry) => readEntryRecursive(entry)));
          const allFiles = fileList.flat();
          await processFolderFiles(allFiles);
        } catch (err) {
          console.error('Drag drop folder error:', err);
          setError('Error reading dropped folder.');
          setIsProcessing(false);
        }
        return;
      }
    }

    // 3. Fallback: single markdown file
    processSingleMarkdownFile(files[0]);
  }, [activeTab, processSingleMarkdownFile, onFolderLoaded]);

  const handleSingleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        processZipFile(file);
      } else {
        processSingleMarkdownFile(file);
      }
    }
  }, [processSingleMarkdownFile]);

  const handleFolderInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const fileEntries = files.map((file) => ({
      path: file.webkitRelativePath || file.name,
      file,
    }));

    await processFolderFiles(fileEntries);
  }, []);

  const handleZipFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processZipFile(e.target.files[0]);
    }
  }, []);

  const handleGitHubFetch = async (overrideUrl?: string) => {
    const inputToUse = overrideUrl || githubInput;
    if (!inputToUse.trim()) {
      setError('Please enter a GitHub repository URL or owner/repo.');
      return;
    }

    const parsed = parseGitHubUrl(inputToUse);
    if (!parsed) {
      setError('Invalid GitHub URL format. Use "owner/repo" or "https://github.com/owner/repo"');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus(`Connecting to github.com/${parsed.owner}/${parsed.repo}...`);

    try {
      const items = await fetchGitHubRepoMarkdown(parsed, (status) => {
        setProcessingStatus(status);
      });

      if (onFolderLoaded) {
        onFolderLoaded(items, `${parsed.owner}/${parsed.repo}`);
      } else {
        onFileLoaded(items[0].content, items[0].name);
      }
    } catch (err: any) {
      console.error('GitHub fetch error:', err);
      setError(err.message || 'Failed to fetch repository from GitHub.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      setError('Please enter some markdown content.');
      return;
    }
    setError(null);
    onFileLoaded(pasteContent, 'Document.md');
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
      {/* Tab Switcher: Paste -> File -> Folder -> GitHub -> ZIP */}
      <div className="flex items-center gap-1.5 mb-4 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('paste'); setError(null); }}
          className={clsx(
            "flex-1 min-w-[65px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'paste' 
              ? "bg-white text-indigo-700 shadow-xs font-semibold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
          )}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Paste</span>
        </button>

        <button
          onClick={() => { setActiveTab('file'); setError(null); }}
          className={clsx(
            "flex-1 min-w-[65px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'file' 
              ? "bg-white text-indigo-700 shadow-xs font-semibold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>File</span>
        </button>

        <button
          onClick={() => { setActiveTab('folder'); setError(null); }}
          className={clsx(
            "flex-1 min-w-[75px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'folder' 
              ? "bg-white text-indigo-700 shadow-xs font-semibold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
          )}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Folder</span>
        </button>

        <button
          onClick={() => { setActiveTab('github'); setError(null); }}
          className={clsx(
            "flex-1 min-w-[75px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'github' 
              ? "bg-white text-purple-700 shadow-xs font-semibold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
          )}
        >
          <Github className="w-3.5 h-3.5 text-purple-600" />
          <span>GitHub</span>
        </button>

        <button
          onClick={() => { setActiveTab('zip'); setError(null); }}
          className={clsx(
            "flex-1 min-w-[65px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === 'zip' 
              ? "bg-white text-amber-700 shadow-xs font-semibold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
          )}
        >
          <FileArchive className="w-3.5 h-3.5 text-amber-600" />
          <span>ZIP</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* 1. File Tab */}
        {activeTab === 'file' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => singleFileInputRef.current?.click()}
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-6 sm:p-9 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer group flex-1",
              isDragging 
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" 
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
            )}
          >
            <input
              ref={singleFileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleSingleFileInput}
              className="hidden"
            />
            
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors shadow-xs",
              isDragging ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200/60"
            )}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <p className="text-base font-semibold text-slate-900 mb-1">
              Drop a file here
            </p>
            <p className="text-xs text-indigo-600 font-medium mb-3">
              or click to choose one
            </p>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-150">
              .md, .markdown, .txt
            </span>
          </div>
        )}

        {/* 2. Folder Tab */}
        {activeTab === 'folder' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => folderInputRef.current?.click()}
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-6 sm:p-9 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer group flex-1",
              isDragging 
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" 
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
            )}
          >
            <input
              ref={folderInputRef}
              type="file"
              multiple
              onChange={handleFolderInputChange}
              className="hidden"
            />
            
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors shadow-xs",
              isDragging ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200/60"
            )}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              ) : (
                <FolderArchive className="w-6 h-6 text-indigo-600" />
              )}
            </div>

            <p className="text-base font-semibold text-slate-900 mb-1">
              Drop a folder here
            </p>
            <p className="text-xs text-indigo-600 font-medium mb-3">
              or click to choose directory
            </p>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-150">
              Scans all nested markdown documents
            </span>
          </div>
        )}

        {/* 3. GitHub Repo Fetcher Tab (Third) */}
        {activeTab === 'github' && (
          <div className="flex-1 flex flex-col justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GitHub Repo Direct Fetcher</h3>
                  <p className="text-[11px] text-slate-500">Fetch public repositories directly without local downloading</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Repository URL or Path:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGitHubFetch(); }}
                    placeholder="e.g. yd-singh/MD-Viewer or https://github.com/facebook/react"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-slate-800"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => handleGitHubFetch()}
                    disabled={isProcessing || !githubInput.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs shrink-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>{isProcessing ? 'Fetching...' : 'Fetch'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium mr-2">Try an example:</span>
                <div className="inline-flex gap-1.5 flex-wrap mt-1">
                  {GITHUB_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => {
                        setGithubInput(preset.url);
                        handleGitHubFetch(preset.url);
                      }}
                      disabled={isProcessing}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors border border-slate-200 font-medium disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
              <span className="font-semibold">How it works:</span> We query the GitHub Git Trees API and stream raw files via CDN. Supports specific branches and subdirectories (e.g. <code>owner/repo/tree/main/docs</code>).
            </div>
          </div>
        )}

        {/* 4. ZIP Archive Tab */}
        {activeTab === 'zip' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-6 sm:p-9 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer group flex-1",
              isDragging 
                ? "border-amber-500 bg-amber-50/60 scale-[1.01]" 
                : "border-amber-200/80 hover:border-amber-400 hover:bg-amber-50/30 bg-white"
            )}
          >
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleZipFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors shadow-xs",
              isDragging ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
            )}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileArchive className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {isProcessing ? 'Decompressing Archive...' : 'Upload ZIP Archive'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 max-w-sm">
              Drag & drop a `.zip` file from your computer. We unpack and parse all markdown documents client-side using JSZip.
            </p>

            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Client-side decompression • 100% private</span>
            </div>
          </div>
        )}

        {/* 5. Paste Markdown Tab (Last) */}
        {activeTab === 'paste' && (
          <div className="flex-1 flex flex-col min-h-[280px]">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste or write markdown here... (e.g. # Architecture, tables, code blocks, mermaid diagrams)"
              className="flex-1 w-full p-4 rounded-2xl border border-slate-200 bg-white shadow-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-mono text-xs sm:text-sm leading-relaxed"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {pasteContent.trim().length} characters
              </span>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteContent.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                Preview Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Status Message */}
      {isProcessing && processingStatus && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-indigo-800 text-xs animate-in fade-in shrink-0">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span className="font-medium truncate">{processingStatus}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-700 animate-in fade-in slide-in-from-top-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
