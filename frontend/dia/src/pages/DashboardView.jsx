import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import html2canvas from 'html2canvas-pro';
import pptxgen from 'pptxgenjs';
import ChartWidget from '../components/Charts/ChartWidget';
import { loadPages, loadThemeKey } from '../utils/layout';
import { buildDashboardHtml } from '../utils/htmlExport';
import { DiaMark } from '../components/Brand/Logo';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DashboardView() {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const [pages] = useState(() => loadPages() || []);
  const [themeKey] = useState(() => loadThemeKey());
  const [activePageId, setActivePageId] = useState(() => (loadPages() || [])[0]?.id ?? null);
  const [exporting, setExporting] = useState(null); // 'ppt' | 'html' | null

  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const hasWidgets = pages.some(p => p.widgets.length > 0);

  // (Re)initialize the static grid whenever the visible page changes.
  useEffect(() => {
    if (!gridRef.current || !activePage?.widgets?.length) return;
    const grid = GridStack.init({
      cellHeight: 100,
      margin: 10,
      staticGrid: true,
      float: true,
      disableOneColumnMode: true
    }, gridRef.current);
    gridRef.current.querySelectorAll('.grid-stack-item').forEach(el => grid.makeWidget(el));
    return () => grid.destroy(false);
  }, [activePageId, pages]);

  // Walks through every non-empty page, waits for the charts to render,
  // and returns one full-resolution snapshot per widget with its grid position.
  const capturePages = async () => {
    const captured = [];
    const originalId = activePageId;

    for (const page of pages) {
      if (page.widgets.length === 0) continue;
      setActivePageId(page.id);
      await sleep(1000); // let Chart.js finish its render animation

      const gridEl = gridRef.current;
      // Transparent background keeps each card's rounded corners; the export re-adds one shadow in CSS.
      // Shadows are stripped during capture: baked-in shadows show through the transparent
      // corners as a ghost "second card" edge in the exported image.
      const masterCanvas = await html2canvas(gridEl, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        // The clone renders in an iframe without the page scrollbar, so it lays out wider
        // than the live page. GridStack positions widgets in percentages, so every card
        // would drift right proportional to its x — pin the viewport and the grid's pixel
        // width so the clone's layout matches the live one exactly.
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        onclone: (doc) => {
          // The clone renders as soon as its iframe reports loaded. In production the
          // app's CSS is an external file served from a CDN, and on a slow fetch the
          // render wins the race and the snapshot comes out unstyled. Inline the rules
          // that are already loaded here and drop the same-origin <link> tags so the
          // clone never depends on the network.
          const inlineCss = [...document.styleSheets].map(sheet => {
            try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); } catch { return ''; }
          }).join('\n');
          if (inlineCss) {
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
              try { if (new URL(link.href, location.href).origin === location.origin) link.remove(); } catch { /* keep */ }
            });
            const style = doc.createElement('style');
            style.textContent = inlineCss;
            doc.head.appendChild(style);
          }
          doc.querySelectorAll('*').forEach(node => { node.style.boxShadow = 'none'; });
          // Interactive-only controls (e.g. table search) have no place in a static snapshot.
          doc.querySelectorAll('[data-export-hide]').forEach(node => { node.style.display = 'none'; });
          const clonedGrid = doc.querySelector('main .grid-stack');
          if (clonedGrid) {
            clonedGrid.style.width = `${gridEl.offsetWidth}px`;
            clonedGrid.style.minWidth = `${gridEl.offsetWidth}px`;
            clonedGrid.style.maxWidth = `${gridEl.offsetWidth}px`;
          }
        }
      });

      const widgets = [...gridEl.querySelectorAll('.grid-stack-item')].map(el => {
        // Crop the card itself, not the grid cell: the cell includes GridStack's
        // transparent margin, which would render as an ugly white halo in exports.
        const card = el.querySelector('.grid-stack-item-content') || el;
        const x = el.offsetLeft + card.offsetLeft;
        const y = el.offsetTop + card.offsetTop;
        const w = card.offsetWidth;
        const h = card.offsetHeight;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = w * 2;
        cropCanvas.height = h * 2;
        cropCanvas.getContext('2d').drawImage(masterCanvas, x * 2, y * 2, w * 2, h * 2, 0, 0, w * 2, h * 2);
        return { img: cropCanvas.toDataURL('image/png'), x, y, w, h };
      });

      captured.push({
        name: page.name,
        width: gridEl.offsetWidth,
        height: gridEl.offsetHeight,
        widgets
      });
    }

    setActivePageId(originalId);
    await sleep(300);
    return captured;
  };

  const handleExportPPT = async () => {
    try {
      setExporting('ppt');
      const captured = await capturePages();

      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      const titleSlide = pres.addSlide();
      titleSlide.background = { color: '4F46E5' };
      titleSlide.addText('Analytics Dashboard Report', {
        x: '10%', y: '40%', w: '80%', h: 1,
        fontSize: 44, color: 'FFFFFF', bold: true, align: 'center'
      });
      titleSlide.addText('Generated securely by DIA', {
        x: '10%', y: '55%', w: '80%', h: 1,
        fontSize: 18, color: 'E0E7FF', align: 'center'
      });

      const MAX_W = 9.5;
      const MAX_H = 5.125;

      for (const page of captured) {
        if (captured.length > 1) {
          const divider = pres.addSlide();
          divider.background = { color: '0F172A' };
          divider.addText(page.name, {
            x: '10%', y: '42%', w: '80%', h: 1,
            fontSize: 36, color: 'FFFFFF', bold: true, align: 'center'
          });
        }

        for (const widget of page.widgets) {
          let w = widget.w / 96; // px -> inches at 96 DPI
          let h = (widget.h || 1) / 96;
          if (w > MAX_W || h > MAX_H) {
            const scale = Math.min(MAX_W / w, MAX_H / h);
            w *= scale;
            h *= scale;
          }
          const slide = pres.addSlide();
          slide.background = { color: 'F9FAFB' };
          slide.addImage({ data: widget.img, x: (10 - w) / 2, y: (5.625 - h) / 2, w, h });
        }
      }

      await pres.writeFile({ fileName: 'DIA_Analytics_Report.pptx' });
    } catch (error) {
      console.error('Error exporting to PPT:', error);
      alert(`Failed to export presentation. Error: ${error.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportHTML = async () => {
    try {
      setExporting('html');
      // Interactive export: rebuilt from widget configs (aggregates + table data),
      // not from screenshots — charts, search and drill-down stay usable in the file.
      const html = buildDashboardHtml(pages, { title: 'DIA Dashboard', themeKey });

      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DIA_Dashboard.html';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      alert(`Failed to export HTML. Error: ${error.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Client Facing Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <DiaMark size={30} />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Client Dashboard View</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPPT}
            disabled={!!exporting || !hasWidgets}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center border disabled:opacity-50 ${exporting === 'ppt' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {exporting === 'ppt' ? (
              <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Exporting...</>
            ) : (
              <><i className="fa-solid fa-file-powerpoint mr-2 text-orange-600"></i> Export to PPT</>
            )}
          </button>

          <button
            onClick={handleExportHTML}
            disabled={!!exporting || !hasWidgets}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center border disabled:opacity-50 ${exporting === 'html' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            title="Download the entire dashboard (all pages) as one self-contained HTML file"
          >
            {exporting === 'html' ? (
              <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Exporting...</>
            ) : (
              <><i className="fa-solid fa-file-code mr-2 text-sky-600"></i> Save as HTML</>
            )}
          </button>

          <button
            onClick={() => navigate('/builder')}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to Builder
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Pages Sidebar */}
        {pages.length > 0 && (
          <aside className="w-64 bg-white text-slate-600 flex flex-col shrink-0 overflow-y-auto border-r border-slate-200">
            <div className="flex items-center space-x-3 px-5 pt-6 pb-5">
              <DiaMark size={36} />
              <div>
                <div className="text-[17px] leading-tight" style={{ color: '#274F91', fontFamily: "'Space Grotesk', 'DM Sans', sans-serif", fontWeight: 700 }}>DIA</div>
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: '#274F91' }}>Data into Action</div>
              </div>
            </div>

            <div className="px-6 pb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Pages
            </div>
            <nav className="px-3 space-y-1 flex-1">
              {pages.map((page, idx) => {
                const isActive = page.id === activePage?.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => setActivePageId(page.id)}
                    className={`group w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold mr-3 shrink-0 transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{page.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="px-5 py-4 border-t border-slate-100 mt-4">
              <div className="flex items-center text-[11px] font-bold text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Zero Data Retention
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Your data stays in this browser.</p>
            </div>
          </aside>
        )}

        {/* Dashboard Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {!activePage || activePage.widgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 border-dashed text-gray-400">
                <i className="fa-solid fa-face-frown-open text-4xl mb-4"></i>
                <p>{pages.length === 0 ? 'No dashboard layout saved.' : `"${activePage?.name}" has no widgets yet.`}</p>
                <button
                  onClick={() => navigate('/builder')}
                  className="mt-4 text-indigo-600 hover:underline"
                >
                  Go to Builder
                </button>
              </div>
            ) : (
              <div key={activePage.id} ref={gridRef} className="grid-stack">
                {activePage.widgets.map(widget => (
                  <div
                    key={widget.id}
                    className="grid-stack-item"
                    gs-id={widget.id}
                    gs-x={widget.x}
                    gs-y={widget.y}
                    gs-w={widget.w}
                    gs-h={widget.h}
                  >
                    <div className="grid-stack-item-content bg-transparent shadow-none p-0 overflow-visible">
                      <ChartWidget
                        widget={widget}
                        isReadonly={true}
                        themeKey={themeKey}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
