import { useEffect, useRef } from 'react';
import { GridStack } from 'gridstack';
import ChartWidget from '../Charts/ChartWidget';

export default function GridCanvas({ widgets, setWidgets, isReadonly = false, onConfigureWidget }) {
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
      disableOneColumnMode: true
    }, gridRef.current);

    // Handle dropping in a new widget from the Toolbox
    gridInstance.current.on('added', (event, items) => {
      // items are the DOM elements dropped in
      if (!items || items.length === 0) return;

      const newWidgets = [];

      items.forEach(item => {
        // Only process external drops (they will have data-type from toolbox)
        if (item.el && item.el.hasAttribute('data-type')) {
          // React StrictMode can leave two live grid instances, each announcing the
          // same drop — process every dropped element exactly once.
          if (item.el.__diaProcessed) return;
          item.el.__diaProcessed = true;
          const type = item.el.getAttribute('data-type');

          // Remove GridStack's dropped clone including its DOM node (second arg!),
          // without firing 'removed' — React renders the real widget itself.
          gridInstance.current.removeWidget(item.el, true, false);

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

    // Sync positions into React only when a gesture ENDS. Doing it on 'change'
    // re-rendered every chart on each cell crossing and made dragging stutter.
    const syncPositionsFromEngine = () => {
      const nodes = gridInstance.current?.engine?.nodes || [];
      const byId = new Map(nodes.map(n => [n.el?.getAttribute('gs-id'), n]));
      setWidgets(prev => {
        let changed = false;
        const next = prev.map(w => {
          const n = byId.get(w.id);
          if (!n) return w;
          if (w.x === n.x && w.y === n.y && w.w === n.w && w.h === n.h) return w;
          changed = true;
          return { ...w, x: n.x, y: n.y, w: n.w, h: n.h };
        });
        return changed ? next : prev;
      });
    };
    gridInstance.current.on('dragstop', syncPositionsFromEngine);
    gridInstance.current.on('resizestop', syncPositionsFromEngine);
    // An external drop can push existing widgets aside; capture their new spots too.
    gridInstance.current.on('dropped', () => setTimeout(syncPositionsFromEngine, 0));

    return () => {
      if (gridInstance.current) {
        gridInstance.current.destroy(false);
        gridInstance.current = null;
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

    // Click-added widgets are auto-placed by the engine; store the assigned spot.
    if (uninitialized.length > 0) {
      const nodes = gridInstance.current.engine.nodes;
      const byId = new Map(nodes.map(n => [n.el?.getAttribute('gs-id'), n]));
      setWidgets(prev => {
        let changed = false;
        const next = prev.map(w => {
          if (w.x !== undefined) return w;
          const n = byId.get(w.id);
          if (!n) return w;
          changed = true;
          return { ...w, x: n.x, y: n.y, w: n.w, h: n.h };
        });
        return changed ? next : prev;
      });
    }
  }, [widgets, setWidgets]);

  const removeWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    // Also remove from gridstack immediately
    const el = gridRef.current.querySelector(`[gs-id="${id}"]`);
    if (el && gridInstance.current) {
       gridInstance.current.removeWidget(el, false);
    }
  };

  const handleConfigure = (id) => {
    if (onConfigureWidget) {
      onConfigureWidget(id);
    }
  };

  return (
    <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-xl">
      <div ref={gridRef} className="grid-stack min-h-[500px]">
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
