import { useEffect, useRef, useState } from 'react';
import { GridStack } from 'gridstack';
import ChartWidget from '../Charts/ChartWidget';

export default function GridCanvas({ widgets, setWidgets, isReadonly = false }) {
  const gridRef = useRef(null);
  const gridInstance = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // Initialize GridStack
    gridInstance.current = GridStack.init({
      cellHeight: 100,
      margin: 10,
      acceptWidgets: !isReadonly,
      staticGrid: isReadonly,
      float: true,
    }, gridRef.current);

    // Handle dropping in a new widget from the Toolbox
    gridInstance.current.on('added', (event, items) => {
      // items are the DOM elements dropped in
      if (!items || items.length === 0) return;
      
      const newWidgets = [];
      
      items.forEach(item => {
        // Only process external drops (they will have data-type from toolbox)
        if (item.el && item.el.hasAttribute('data-type')) {
          const type = item.el.getAttribute('data-type');
          
          // Remove the dummy DOM element GridStack added (we let React render it!)
          gridInstance.current.removeWidget(item.el, false);
          
          newWidgets.push({
            id: `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: type,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            config: null
          });
        }
      });
      
      if (newWidgets.length > 0) {
        setWidgets(prev => [...prev, ...newWidgets]);
      }
    });

    // Handle moving/resizing existing widgets
    gridInstance.current.on('change', (event, items) => {
      if (!items) return;
      
      setWidgets(prev => {
        const next = [...prev];
        items.forEach(item => {
          if (!item.id) return;
          const idx = next.findIndex(w => w.id === item.id);
          if (idx !== -1) {
            next[idx] = { ...next[idx], x: item.x, y: item.y, w: item.w, h: item.h };
          }
        });
        return next;
      });
    });

    return () => {
      if (gridInstance.current) {
        gridInstance.current.destroy(false);
      }
    };
  }, []);

  // Update static mode dynamically when entering/exiting Viewer Mode
  useEffect(() => {
    if (gridInstance.current) {
      gridInstance.current.setStatic(isReadonly);
      // Optional: toggle a class on the grid for CSS styling if needed
      if (isReadonly) {
        gridRef.current.classList.add('grid-readonly');
      } else {
        gridRef.current.classList.remove('grid-readonly');
      }
    }
  }, [isReadonly]);

  // When React updates the DOM with new widgets, we need to tell Gridstack to track them
  useEffect(() => {
    if (!gridInstance.current || !gridRef.current) return;
    
    // 1. Sync deletions: Remove widgets from GridStack engine that React has removed
    const engineNodes = gridInstance.current.engine.nodes;
    [...engineNodes].forEach(node => {
      if (node.el && !widgets.find(w => w.id === node.el.getAttribute('gs-id'))) {
         gridInstance.current.removeWidget(node.el, false);
      }
    });

    // 2. Sync additions: Find all uninitialized grid-stack-items and initialize them
    const uninitialized = gridRef.current.querySelectorAll('.grid-stack-item:not(.grid-stack-item-initialized)');
    uninitialized.forEach(el => {
      gridInstance.current.makeWidget(el);
      el.classList.add('grid-stack-item-initialized');
    });
  }, [widgets]);

  const removeWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    // Also remove from gridstack immediately
    const el = gridRef.current.querySelector(`[gs-id="${id}"]`);
    if (el && gridInstance.current) {
       gridInstance.current.removeWidget(el, false);
    }
  };

  const handleConfigure = (id) => {
    // Open modal (to be implemented)
    console.log("Configure widget", id);
  };

  return (
    <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-xl min-h-[500px]">
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
            gs-auto-position={widget.x === undefined ? "true" : undefined}
          >
            <div className="grid-stack-item-content bg-transparent shadow-none p-0 overflow-visible">
              <ChartWidget 
                widget={widget} 
                onRemove={removeWidget} 
                onConfigure={handleConfigure}
                isReadonly={isReadonly}
              />
            </div>
          </div>
        ))}
      </div>
      
      {widgets.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <p className="text-gray-400 font-medium">Drag and drop a chart from the toolbox here</p>
        </div>
      )}
    </div>
  );
}
