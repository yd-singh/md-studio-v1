import React, { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Maximize2, Minimize2, Download, ZoomIn, ZoomOut, RotateCcw, Code, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MermaidProps {
  chart: string;
  isDark?: boolean;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart, isDark = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'code'>('chart');
  const renderedSvg = useMemo(() => {
    if (!svg) return '';
    return svg
      // 1. Expand foreignObject height by 24px and ensure overflow: visible so multi-line text is never clipped
      .replace(/<foreignObject([^>]*?)height="([^"]+)"([^>]*?)>/gi, (_match, before, h, after) => {
        const numH = parseFloat(h);
        const newH = isNaN(numH) ? h : Math.round(numH + 24);
        return `<foreignObject${before}height="${newH}" style="overflow: visible !important;"${after}>`;
      })
      // 2. Clear any clipping or overflow restrictions in SVG nodes
      .replace(/overflow:\s*hidden/gi, 'overflow: visible')
      .replace(/text-overflow:\s*ellipsis/gi, 'text-overflow: clip')
      .replace(/white-space:\s*nowrap/gi, 'white-space: normal')
      // 3. Inject explicit anti-clipping CSS directly into the SVG stylesheet
      .replace(/<\/style>/i, `
        .node foreignObject, .label foreignObject {
          overflow: visible !important;
        }
        .node foreignObject div, .label foreignObject div {
          overflow: visible !important;
          line-height: 1.32 !important;
          box-sizing: border-box !important;
          padding-bottom: 6px !important;
        }
        .node text, .label text {
          dominant-baseline: central !important;
          line-height: 1.32 !important;
        }
      </style>`);
  }, [svg]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true,
        padding: 24,
        nodeSpacing: 50,
        rankSpacing: 50,
      },
      themeVariables: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        primaryTextColor: isDark ? '#e2e8f0' : '#1e293b',
        secondaryTextColor: isDark ? '#cbd5e1' : '#334155',
        tertiaryTextColor: isDark ? '#cbd5e1' : '#475569',
        lineColor: isDark ? '#94a3b8' : '#475569',
        nodeTextColor: isDark ? '#e2e8f0' : '#1e293b',
        edgeLabelBackground: isDark ? '#0f172a' : '#ffffff',
      },
      themeCSS: `
        .label foreignObject {
          overflow: visible !important;
        }
        .label foreignObject div {
          line-height: 1.32 !important;
          overflow: visible !important;
          padding-bottom: 6px !important;
        }
        .node text, .node .label {
          line-height: 1.32 !important;
        }
      `,
    });

    const renderChart = async () => {
      try {
        if (!ref.current) return;
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        if (errorMessage.includes('dynamically imported module')) {
          setError('Failed to load Mermaid diagram module. Please try refreshing the page.');
        } else {
          setError('Failed to render diagram. Please check syntax.');
        }
      }
    };

    renderChart();
  }, [chart, isDark]);

  const handleDownload = () => {
    if (!renderedSvg) return;

    const downloadSvgFallback = () => {
      const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(renderedSvg, 'image/svg+xml');
      const svgEl = doc.documentElement;

      if (!svgEl || svgEl.nodeName.toLowerCase() !== 'svg') {
        downloadSvgFallback();
        return;
      }

      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const viewBox = (svgEl.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      const vbWidth = Number.isFinite(viewBox[2]) ? viewBox[2] : 0;
      const vbHeight = Number.isFinite(viewBox[3]) ? viewBox[3] : 0;
      const attrWidth = parseFloat(svgEl.getAttribute('width') || '0');
      const attrHeight = parseFloat(svgEl.getAttribute('height') || '0');
      const width = Math.max(vbWidth || attrWidth, 600);
      const height = Math.max(vbHeight || attrHeight, 400);

      const serialized = new XMLSerializer().serializeToString(svgEl);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          downloadSvgFallback();
          return;
        }

        ctx.fillStyle = isDark ? '#020617' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            downloadSvgFallback();
            return;
          }
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'diagram.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }, 'image/png');
      };

      img.onerror = () => {
        downloadSvgFallback();
      };

      img.src = svgDataUrl;
    } catch (_error) {
      downloadSvgFallback();
    }
  };

  if (error) {
    return (
      <div 
        data-role="mermaid-container"
        data-mermaid-code={chart}
        className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-mono whitespace-pre-wrap"
      >
        {error}
        <div className="mt-2 text-xs opacity-75">Source:</div>
        <pre className="mt-1 text-xs opacity-75 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      data-role="mermaid-container"
      data-mermaid-code={chart}
      className={clsx(
        "my-8 rounded-xl overflow-hidden shadow-sm border",
        isDark ? "bg-slate-950 border-slate-700" : "bg-white border-slate-200",
        isFullScreen && "fixed inset-0 z-[100] m-0 rounded-none h-screen flex flex-col",
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between px-4 py-2 border-b shrink-0",
          isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200",
        )}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={clsx(
              "p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === 'chart' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Chart
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={clsx(
              "p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === 'code' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'chart' && (
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={clsx("relative", isDark ? "bg-slate-950" : "bg-white", isFullScreen ? "flex-1 overflow-hidden" : "overflow-x-auto")}>
        {viewMode === 'code' ? (
          <pre className="p-4 text-sm font-mono text-slate-700 bg-slate-50 h-full overflow-auto m-0 border-none rounded-none">
            {chart}
          </pre>
        ) : (
          isFullScreen ? (
            <TransformWrapper 
              initialScale={1} 
              minScale={0.5} 
              maxScale={4} 
              centerOnInit={true}
              limitToBounds={false}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur shadow-lg border border-slate-200 p-1.5 rounded-lg z-10">
                    <button onClick={() => zoomIn()} className="p-1.5 hover:bg-slate-100 rounded-md"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => zoomOut()} className="p-1.5 hover:bg-slate-100 rounded-md"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => resetTransform()} className="p-1.5 hover:bg-slate-100 rounded-md"><RotateCcw className="w-4 h-4" /></button>
                  </div>
                  <TransformComponent 
                    wrapperClass="!w-full !h-full" 
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <div 
                      className="mermaid-diagram w-full h-full flex items-center justify-center p-8"
                      dangerouslySetInnerHTML={{ __html: renderedSvg }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          ) : (
            <div 
              ref={ref}
              className="mermaid-diagram p-4 flex justify-center min-w-full"
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
            />
          )
        )}
      </div>
    </div>
  );
};