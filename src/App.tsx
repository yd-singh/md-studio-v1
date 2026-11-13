import React, { useState } from 'react';
import { FileUpload, FolderItem } from './components/FileUpload';
import { DocumentPreview } from './components/DocumentPreview';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Github, Linkedin, Sparkles } from 'lucide-react';

export default function App() {
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [folderFiles, setFolderFiles] = useState<FolderItem[] | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string>('');

  const handleFileLoaded = (content: string, name: string) => {
    setFolderFiles(null);
    setCurrentFilePath('');
    setMarkdownContent(content);
    setFileName(name);
  };

  const handleFolderLoaded = (files: FolderItem[], title?: string) => {
    if (!files.length) return;
    setFolderFiles(files);
    
    // Auto-select root README.md if present, else first file
    const readmeFile = files.find(f => /(^|\/)readme\.md$/i.test(f.path)) || files[0];
    setCurrentFilePath(readmeFile.path);
    setFileName(title ? `${title}/${readmeFile.name}` : readmeFile.name);
    setMarkdownContent(readmeFile.content);
  };

  const handleNavigateToFile = (path: string) => {
    if (!folderFiles) return;
    const target = folderFiles.find(
      f => f.path === path || f.path.toLowerCase() === path.toLowerCase()
    );
    if (target) {
      setCurrentFilePath(target.path);
      setFileName(target.name);
      setMarkdownContent(target.content);
    }
  };

  const handleContentChange = (newContent: string) => {
    setMarkdownContent(newContent);
    if (folderFiles && currentFilePath) {
      setFolderFiles(prev => 
        prev ? prev.map(f => f.path === currentFilePath ? { ...f, content: newContent } : f) : null
      );
    }
  };

  const handleBack = () => {
    setMarkdownContent(null);
    setFileName('');
    setFolderFiles(null);
    setCurrentFilePath('');
  };

  if (markdownContent) {
    return (
      <DocumentPreview 
        content={markdownContent} 
        fileName={fileName} 
        onBack={handleBack}
        folderFiles={folderFiles ? folderFiles.map(f => ({ path: f.path, name: f.name })) : undefined}
        currentFilePath={currentFilePath || undefined}
        onNavigateToFile={folderFiles ? handleNavigateToFile : undefined}
        onContentChange={handleContentChange}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Dynamic Animated Ambient Background */}
      <AnimatedBackground />

      {/* Top Bar */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            M
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            Markdown Studio
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/90 text-indigo-700 border border-indigo-150 text-[11px] sm:text-xs font-semibold shadow-2xs backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Vibed by Yash</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <a
            href="https://www.linkedin.com/in/yashdeepsingh/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
          >
            <Linkedin className="w-4 h-4" />
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
          <a
            href="https://github.com/yd-singh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Simplified Card */}
      <main className="relative z-10 max-w-2xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Open Markdown files.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mb-1.5">
            Preview, browse, and export them as PDFs.
          </p>
          <p className="text-xs text-slate-400">
            Everything runs in your browser.
          </p>
        </div>

        {/* Upload panel */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-5 sm:p-7 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] flex flex-col transition-all">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Open Markdown</h2>
          </div>
          <FileUpload 
            onFileLoaded={handleFileLoaded} 
            onFolderLoaded={handleFolderLoaded}
            initialMode="paste"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl w-full mx-auto text-center text-xs text-slate-400 py-2">
        Markdown Studio • Everything runs in your browser
      </footer>
    </div>
  );
}
