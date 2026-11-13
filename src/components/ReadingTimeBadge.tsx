import React, { useState } from 'react';
import { MarkdownMetrics } from '../lib/markdownUtils';
import { Clock, BookOpen, FileText, Hash } from 'lucide-react';

interface ReadingTimeBadgeProps {
  metrics: MarkdownMetrics;
  textColor?: string;
  borderColor?: string;
  bgColor?: string;
}

export function ReadingTimeBadge({
  metrics,
  textColor,
  borderColor,
  bgColor,
}: ReadingTimeBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (metrics.wordCount === 0 && metrics.charCount === 0) {
    return null;
  }

  return (
    <div className="relative inline-block no-print">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-help select-none"
        style={{
          color: textColor,
          borderColor,
          backgroundColor: bgColor,
        }}
        title="Document Reading Statistics"
      >
        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
        <span>{metrics.readingTimeMinutes} min read</span>
        <span className="opacity-30">•</span>
        <span className="opacity-80">{metrics.wordCount.toLocaleString()} words</span>
      </div>

      {showTooltip && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl z-30 border border-slate-800 animate-in fade-in zoom-in-95 pointer-events-none"
        >
          <div className="font-semibold text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
            Document Metrics
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                Reading time:
              </span>
              <span className="font-mono text-white font-medium">{metrics.readingTimeMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                Words:
              </span>
              <span className="font-mono text-white font-medium">{metrics.wordCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-400" />
                Characters:
              </span>
              <span className="font-mono text-white font-medium">{metrics.charCount.toLocaleString()}</span>
            </div>
            {metrics.headingCount > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-amber-400" />
                  Sections:
                </span>
                <span className="font-mono text-white font-medium">{metrics.headingCount}</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800 mt-2 pt-1.5">
            Based on ~200 WPM reading speed
          </div>
        </div>
      )}
    </div>
  );
}
