import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';
import WidgetToolbox from '../components/Toolbar/WidgetToolbox';
import GridCanvas from '../components/Canvas/GridCanvas';
import DataUploader from '../components/Sidebar/DataUploader';
import TemplateSelector from '../components/Sidebar/TemplateSelector';
import DataConfigModal from '../components/Modals/DataConfigModal';
import { RAW_DATA_KEY, refreshWidgetConfigs } from '../utils/aggregate';
import { DEMO_MODE } from '../utils/demo';
import { loadPages, savePages, createPage } from '../utils/layout';

export default function Builder() {
  const navigate = useNavigate();

  const [pages, setPages] = useState(() => loadPages() || [createPage('Page 1')]);
  const [activePageId, setActivePageId] = useState(null);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('template');

  // Data & Configuration State
  const [loadedDataSheets, setLoadedDataSheets] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configuringWidgetId, setConfiguringWidgetId] = useState(null);
  const [dataNotice, setDataNotice] = useState(null);

  useEffect(() => {
    localforage.getItem(RAW_DATA_KEY).then(data => {
      if (data) setLoadedDataSheets(data);
    }).catch(err => console.error("Error loading data from localforage:", err));
  }, []);

  useEffect(() => {
    if (!dataNotice) return;
    const timer = setTimeout(() => setDataNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [dataNotice]);

  // Applies a widget-array update to the page that is currently open.
  const setActiveWidgets = (updater) => {
    const pageId = activePage.id;
    setPages(prev => prev.map(p =>
      p.id === pageId
        ? { ...p, widgets: typeof updater === 'function' ? updater(p.widgets) : updater }
        : p
    ));
  };

  const handleAddPage = () => {
    const page = createPage(`Page ${pages.length + 1}`);
    setPages(prev => [...prev, page]);
    setActivePageId(page.id);
  };

  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const startRename = (page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const commitRename = () => {
    const name = editingName.trim();
    if (name) {
      setPages(prev => prev.map(p => p.id === editingPageId ? { ...p, name } : p));
    }
    setEditingPageId(null);
  };

  const handleDeletePage = (page) => {
    if (pages.length <= 1) return;
    if (!window.confirm(`Delete "${page.name}" and its ${page.widgets.length} widget${page.widgets.length === 1 ? '' : 's'}?`)) return;
    setPages(prev => {
      const next = prev.filter(p => p.id !== page.id);
      if (page.id === activePage.id) setActivePageId(next[0].id);
      return next;
    });
  };

  const toggleViewerMode = () => {
    setIsViewerMode(!isViewerMode);
    if (!isViewerMode) {
      setIsLeftOpen(false);
      setIsRightOpen(false);
    } else {
      setIsLeftOpen(true);
      setIsRightOpen(true);
    }
  };

  const handleDataLoaded = (data) => {
    const sheets = data?.sheets || null;
    setLoadedDataSheets(sheets);
    if (!sheets || !data.refresh) return;

    // Recalculate every configured widget on every page against the new data.
    setPages(prev => {
      let refreshedTotal = 0;
      const skippedAll = [];
      const next = prev.map(p => {
        const { widgets, refreshed, skipped } = refreshWidgetConfigs(p.widgets, sheets);
        refreshedTotal += refreshed;
        skippedAll.push(...skipped);
        return { ...p, widgets };
      });
      if (refreshedTotal > 0 || skippedAll.length > 0) {
        const parts = [];
        if (refreshedTotal > 0) parts.push(`${refreshedTotal} chart${refreshedTotal === 1 ? '' : 's'} recalculated from ${data.name}`);
        if (skippedAll.length > 0) parts.push(`${skippedAll.length} kept previous values (${skippedAll[0].reason})`);
        setDataNotice({ tone: skippedAll.length > 0 ? 'warn' : 'ok', text: parts.join(' · ') });
      }
      return next;
    });
  };

  const handleDataRemoved = () => {
    setLoadedDataSheets(null);
    setDataNotice({ tone: 'ok', text: 'Data removed from this browser. Charts keep their last calculated values.' });
  };

  const handleConfigureWidget = (id) => {
    setConfiguringWidgetId(id);
    setIsConfigModalOpen(true);
  };

  const handleAddWidget = (type, w, h) => {
    const newWidget = {
      id: `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      w,
      h,
      config: null
    };
    setActiveWidgets(prev => [...prev, newWidget]);
  };

  const handleApplyTemplate = (layout) => {
    const newWidgets = layout.map((w, index) => ({
      ...w,
      id: `widget-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`
    }));
    setActiveWidgets(newWidgets);
  };

  const handleSave = () => {
    savePages(pages);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isLeftOpen, isRightOpen]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center space-x-3">
          <svg className="w-7 h-7 drop-shadow-sm" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#builder-grad)"/>
            <path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fillOpacity="0.15"/>
            <circle cx="15" cy="16" r="3.5" fill="white"/>
            <defs>
              <linearGradient id="builder-grad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4F46E5" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">DIA <span className="font-medium text-gray-400">| Builder</span></h1>
          {DEMO_MODE && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5" title="No login, no backend – everything runs in this browser">
              Demo mode
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (window.confirm(`Remove all widgets from "${activePage.name}"?`)) setActiveWidgets([]);
            }}
            className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mr-2"
          >
            Clear Page
          </button>

          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm border flex items-center ${saveSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            <i className={`fa-solid ${saveSuccess ? 'fa-check' : 'fa-floppy-disk'} mr-2`}></i>
            {saveSuccess ? 'Saved!' : 'Save Layout'}
          </button>

          <button
            onClick={toggleViewerMode}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center ${isViewerMode ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 border'}`}
          >
            <i className={`fa-solid ${isViewerMode ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
            {isViewerMode ? 'Exit Preview' : 'Preview'}
          </button>

          <button
            onClick={() => navigate('/view')}
            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm flex items-center"
          >
            Go to Dashboard <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isLeftOpen ? 'w-80' : 'w-0 opacity-0'}`}
        >
          <div className="flex border-b border-gray-200 w-80 shrink-0">
            <button
              onClick={() => setActiveLeftTab('template')}
              className={`flex-1 py-3 text-sm font-semibold transition ${activeLeftTab === 'template' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              1. Template
            </button>
            <button
              onClick={() => setActiveLeftTab('data')}
              className={`flex-1 py-3 text-sm font-semibold transition ${activeLeftTab === 'data' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              2. Load Data
            </button>
          </div>
          <div className="flex-1 p-5 overflow-y-auto w-80">
            {activeLeftTab === 'data' ? (
              <DataUploader onDataLoaded={handleDataLoaded} onDataRemoved={handleDataRemoved} loadedDataSheets={loadedDataSheets} />
            ) : (
              <TemplateSelector onApplyTemplate={handleApplyTemplate} />
            )}
          </div>
        </aside>

        {/* Center Canvas / Grid Area */}
        <main className="flex-1 bg-gray-50/50 p-6 overflow-y-auto relative min-w-0 transition-all duration-300">
          {/* Left Sidebar Toggle Button */}
          {!isViewerMode && (
            <button
              onClick={() => setIsLeftOpen(!isLeftOpen)}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-20 bg-white border border-gray-200 border-l-0 shadow-sm rounded-r-md py-3 px-1.5 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
              title={isLeftOpen ? "Collapse Left Panel" : "Expand Left Panel"}
            >
              <i className={`fa-solid ${isLeftOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[10px]`}></i>
            </button>
          )}

          {/* Right Sidebar Toggle Button */}
          {!isViewerMode && (
            <button
              onClick={() => setIsRightOpen(!isRightOpen)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-white border border-gray-200 border-r-0 shadow-sm rounded-l-md py-3 px-1.5 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
              title={isRightOpen ? "Collapse Right Panel" : "Expand Right Panel"}
            >
              <i className={`fa-solid ${isRightOpen ? 'fa-chevron-right' : 'fa-chevron-left'} text-[10px]`}></i>
            </button>
          )}

          {/* Page tabs */}
          <div className="flex items-center mb-4 space-x-1 overflow-x-auto pb-1">
            {pages.map(page => {
              const isActive = page.id === activePage.id;
              const isEditing = editingPageId === page.id;
              return (
                <div
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  onDoubleClick={() => !isViewerMode && startRename(page)}
                  className={`group flex items-center px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <i className="fa-regular fa-file mr-2 text-xs opacity-70"></i>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingPageId(null);
                      }}
                      onBlur={commitRename}
                      className={`bg-transparent outline-none w-28 text-sm font-semibold border-b ${isActive ? 'text-white placeholder-white/50 border-white/40' : 'text-gray-700 border-indigo-300'}`}
                      placeholder="Page name"
                    />
                  ) : (
                    <span className="max-w-[160px] truncate">{page.name}</span>
                  )}
                  {!isViewerMode && !isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(page); }}
                      className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-indigo-600'}`}
                      title="Rename page"
                    >
                      <i className="fa-solid fa-pen text-[10px]"></i>
                    </button>
                  )}
                  {!isViewerMode && !isEditing && pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePage(page); }}
                      className={`ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                      title="Delete page"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  )}
                </div>
              );
            })}
            {!isViewerMode && (
              <button
                onClick={handleAddPage}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 border border-dashed border-gray-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white shrink-0"
                title="Add page"
              >
                <i className="fa-solid fa-plus mr-1.5 text-xs"></i> Page
              </button>
            )}
          </div>

          {dataNotice && (
            <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium border flex items-center ${dataNotice.tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              <i className={`fa-solid ${dataNotice.tone === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-check'} mr-2`}></i>
              {dataNotice.text}
            </div>
          )}

          <GridCanvas
            key={activePage.id}
            widgets={activePage.widgets}
            setWidgets={setActiveWidgets}
            isReadonly={isViewerMode}
            onConfigureWidget={handleConfigureWidget}
          />
        </main>

        {/* Right Sidebar - Chart Toolbox */}
        <aside
          className={`bg-white border-l border-gray-200 flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isRightOpen ? 'w-80' : 'w-0 opacity-0'}`}
        >
          <div className="w-80 h-full">
            <WidgetToolbox onAddWidget={handleAddWidget} onApplyTemplate={handleApplyTemplate} />
          </div>
        </aside>

      </div>

      <DataConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        widgetId={configuringWidgetId}
        widgets={activePage.widgets}
        setWidgets={setActiveWidgets}
        loadedDataSheets={loadedDataSheets}
      />
    </div>
  );
}
