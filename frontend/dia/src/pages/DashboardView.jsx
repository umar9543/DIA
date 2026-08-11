import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import ChartWidget from '../components/Charts/ChartWidget';

export default function DashboardView() {
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const gridInstance = useRef(null);
  
  const [widgets, setWidgets] = useState([]);

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
      }, gridRef.current);
    }
    
    // Initialize new elements
    const uninitialized = gridRef.current.querySelectorAll('.grid-stack-item:not(.grid-stack-item-initialized)');
    uninitialized.forEach(el => {
      gridInstance.current.makeWidget(el);
      el.classList.add('grid-stack-item-initialized');
    });

  }, [widgets]);

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
        
        <button 
          onClick={() => navigate('/builder')}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i> Back to Builder
        </button>
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
