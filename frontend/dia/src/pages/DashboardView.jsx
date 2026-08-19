import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { toPng, toCanvas } from 'html-to-image';
import pptxgen from 'pptxgenjs';
import ChartWidget from '../components/Charts/ChartWidget';

export default function DashboardView() {
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const gridInstance = useRef(null);
  
  const [widgets, setWidgets] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dia_saved_layout');
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!gridRef.current || widgets.length === 0) return;

    if (!gridInstance.current) {
      gridInstance.current = GridStack.init({
        cellHeight: 100,
        margin: 10,
        staticGrid: true, // Read-only mode! No dragging or resizing
        float: true,      // Preserve vertical empty spaces!
        disableOneColumnMode: true
      }, gridRef.current);
    }
    
    // Initialize new elements
    const uninitialized = gridRef.current.querySelectorAll('.grid-stack-item:not(.grid-stack-item-initialized)');
    uninitialized.forEach(el => {
      gridInstance.current.makeWidget(el);
      el.classList.add('grid-stack-item-initialized');
    });

  }, [widgets]);

  const handleExportPPT = async () => {
    if (!gridRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Initialize PPT
      let pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      
      // 1. Add Title Slide
      let titleSlide = pres.addSlide();
      titleSlide.background = { color: '4F46E5' }; // Indigo-600
      titleSlide.addText('Analytics Dashboard Report', { 
        x: '10%', y: '40%', w: '80%', h: 1, 
        fontSize: 44, color: 'FFFFFF', bold: true, align: 'center' 
      });
      titleSlide.addText('Generated securely by DIA', { 
        x: '10%', y: '55%', w: '80%', h: 1, 
        fontSize: 18, color: 'E0E7FF', align: 'center' 
      });

      // 2. Capture the entire dashboard ONCE as a master canvas
      // This is the bulletproof way to prevent Chart.js canvases from going blank during cloning
      const masterCanvas = await toCanvas(gridRef.current, {
        pixelRatio: 2, 
        backgroundColor: '#f9fafb',
      });

      const widgetElements = gridRef.current.querySelectorAll('.grid-stack-item');
      
      for (let i = 0; i < widgetElements.length; i++) {
        const el = widgetElements[i];
        
        // Calculate exact crop coordinates (multiply by 2 because pixelRatio is 2)
        const cropX = el.offsetLeft * 2;
        const cropY = el.offsetTop * 2;
        const cropW = el.offsetWidth * 2;
        const cropH = el.offsetHeight * 2;
        
        // Create an in-memory canvas to hold just this widget
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const ctx = cropCanvas.getContext('2d');
        
        // Slice the widget out of the master canvas
        ctx.drawImage(masterCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        
        const imgData = cropCanvas.toDataURL('image/png');
        
        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;
        
        // Convert pixels to inches (assume 96 DPI screen standard)
        let w = elWidth / 96;
        let h = (elHeight || 1) / 96;
        
        // Max slide dimensions with 0.25 inch margins
        const MAX_W = 9.5;
        const MAX_H = 5.125;
        
        // If it's too big, scale it down proportionally
        // We DO NOT scale up small widgets (like KPI cards)
        if (w > MAX_W || h > MAX_H) {
           const scale = Math.min(MAX_W / w, MAX_H / h);
           w = w * scale;
           h = h * scale;
        }
        
        // Center on slide
        let x = (10 - w) / 2;
        let y = (5.625 - h) / 2;
        
        let slide = pres.addSlide();
        slide.background = { color: 'F9FAFB' };
        
        slide.addImage({
          data: imgData,
          x: x,
          y: y,
          w: w,
          h: h
        });
      }
      
      await pres.writeFile({ fileName: 'DIA_Analytics_Report.pptx' });
      
    } catch (error) {
      console.error("Error exporting to PPT:", error);
      alert(`Failed to export presentation. Error: ${error.message}\nCheck console for details.`);
    } finally {
      setIsExporting(false);
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
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExportPPT}
            disabled={isExporting || widgets.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center ${isExporting ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 border'}`}
          >
            {isExporting ? (
              <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Exporting...</>
            ) : (
              <><i className="fa-solid fa-file-powerpoint mr-2 text-orange-600"></i> Export to PPT</>
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

      {/* Dashboard Canvas */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 border-dashed text-gray-400">
              <i className="fa-solid fa-face-frown-open text-4xl mb-4"></i>
              <p>No dashboard layout saved.</p>
              <button 
                onClick={() => navigate('/builder')}
                className="mt-4 text-indigo-600 hover:underline"
              >
                Go to Builder
              </button>
            </div>
          ) : (
            <div ref={gridRef} className="grid-stack">
              {widgets.map(widget => (
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
  );
}
