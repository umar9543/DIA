import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import html2canvas from 'html2canvas-pro';
import pptxgen from 'pptxgenjs';
import ChartWidget from '../components/Charts/ChartWidget';
import { loadPages } from '../utils/layout';
import { buildDashboardHtml } from '../utils/htmlExport';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DashboardView() {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const [pages] = useState(() => loadPages() || []);
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
          doc.querySelectorAll('*').forEach(node => { node.style.boxShadow = 'none'; });
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
      const captured = await capturePages();
      const html = buildDashboardHtml(captured, { title: 'DIA Dashboard' });

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
          <svg className="w-7 h-7 drop-shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#viewer-grad)"/>
            <path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fillOpacity="0.15"/>
            <circle cx="15" cy="16" r="3.5" fill="white"/>
            <defs>
              <linearGradient id="viewer-grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4F46E5" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
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
              <svg className="w-8 h-8 drop-shadow-sm shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#side-grad)"/>
                <path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fillOpacity="0.15"/>
                <circle cx="15" cy="16" r="3.5" fill="white"/>
                <defs>
                  <linearGradient id="side-grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div className="text-slate-900 font-extrabold text-[17px] leading-tight tracking-tight">DIA</div>
                <div className="text-[11px] text-slate-400 font-semibold">Analytics Dashboard</div>
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
