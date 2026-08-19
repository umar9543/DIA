import { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { RAW_DATA_KEY, buildWidgetConfig } from '../../utils/aggregate';

const CustomSelect = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={selectRef}>
      <div 
        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-medium flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-colors h-[42px]"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? 'text-slate-400 truncate pr-2' : 'text-slate-700 truncate pr-2'}>
          {value ? (options.find(o => o.value === value)?.label || value) : placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1.5">
          {options.map((opt, i) => (
            <div 
              key={i}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DataConfigModal({ isOpen, onClose, widgetId, widgets, setWidgets, loadedDataSheets }) {
  const [selectedSheet, setSelectedSheet] = useState('');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  const [dataLimit, setDataLimit] = useState('top_20');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing config if editing
  useEffect(() => {
    if (isOpen && widgetId) {
      const widget = widgets.find(w => w.id === widgetId);
      if (widget && widget.config) {
        setSelectedSheet(widget.config.sheetName || '');
        setXAxis(widget.config.xAxis || '');
        setYAxis(widget.config.yAxis || '');
        setAggregation(widget.config.aggregation || 'sum');
        setDataLimit(widget.config.dataLimit || 'top_20');
        setSelectedColumns(widget.config.selectedColumns || []);
        setCustomTitle(widget.config.customTitle || '');
      } else {
        // Reset defaults
        if (loadedDataSheets && loadedDataSheets.length > 0) {
          setSelectedSheet(loadedDataSheets[0].sheetName);
        }
        setXAxis('');
        setYAxis('');
        setAggregation('sum');
        setDataLimit('top_20');
        setSelectedColumns([]);
        setCustomTitle('');
      }
      setError(null);
    }
  }, [isOpen, widgetId, widgets, loadedDataSheets]);

  if (!isOpen) return null;

  const currentSheetData = loadedDataSheets?.find(s => s.sheetName === selectedSheet);
  const columns = currentSheetData 
    ? currentSheetData.headers.filter(c => c !== null && c !== undefined && String(c).trim() !== '') 
    : [];

  const widget = widgets.find(w => w.id === widgetId);
  const isSingleValue = ['kpi', 'speedometer'].includes(widget?.type);
  const isTable = widget?.type === 'table';
  const isLineChart = widget?.type === 'line';
  const isRadar = widget?.type === 'radar';
  const isBubble = widget?.type === 'bubble';
  const isMultiMeasure = isRadar || isBubble;

  const handleSave = async () => {
    if (!selectedSheet) {
      setError('Please select a sheet.');
      return;
    }
    if ((isTable || isMultiMeasure) && selectedColumns.length < (isBubble ? 3 : (isRadar ? 2 : 1))) {
      if (isBubble && selectedColumns.length !== 3) {
        setError('Bubble charts require exactly 3 measures (X-Axis, Y-Axis, Bubble Size).');
        return;
      }
      setError(`Please select at least ${isRadar ? 'two columns' : 'one column'}.`);
      return;
    }
    if (isMultiMeasure && !xAxis) {
      setError('Please select an X-Axis to group by.');
      return;
    }
    if (!isTable && !isMultiMeasure && ((!isSingleValue && aggregation !== 'segmentation' && !xAxis) || !yAxis)) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const allRawData = await localforage.getItem(RAW_DATA_KEY);
      if (!allRawData) throw new Error('No data is loaded in this browser. Please load your Excel file first.');

      const newConfig = buildWidgetConfig(widget.type, {
        sheetName: selectedSheet,
        xAxis,
        yAxis,
        aggregation,
        dataLimit,
        selectedColumns,
        customTitle
      }, allRawData);

      setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, config: newConfig } : w));
      onClose();
    } catch (err) {
      console.error('Aggregation error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <i className="fa-solid fa-chart-pie text-indigo-500 mr-2"></i>
            Configure Chart Data
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {!loadedDataSheets || loadedDataSheets.length === 0 ? (
            <div className="text-center py-6">
              <i className="fa-solid fa-file-excel text-4xl text-slate-300 mb-3"></i>
              <p className="text-sm font-medium text-slate-500">No data loaded yet.<br/>Please upload an Excel file in the left sidebar.</p>
            </div>
          ) : (
            <>
              {/* Sheet Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Dataset (Sheet)</label>
                  <CustomSelect 
                    value={selectedSheet}
                    onChange={(val) => setSelectedSheet(val)}
                    placeholder="Select a sheet"
                    options={loadedDataSheets.map(s => ({ value: s.sheetName, label: `${s.sheetName} (${s.headers.length} columns)` }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Custom Title (Optional)</label>
                  <input 
                    type="text" 
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Total Suppliers"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Render Table Column Multi-Select or Chart Axis Mapping */}
              {isTable ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Columns to Display</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {columns.map(col => (
                      <label key={col} className="flex items-center space-x-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, col]);
                            } else {
                              setSelectedColumns(selectedColumns.filter(c => c !== col));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Axis Mapping */}
                  <div className={`grid ${isSingleValue || aggregation === 'segmentation' || isRadar ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                    
                    {!isSingleValue && aggregation !== 'segmentation' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          X-Axis <span className="text-xs font-normal text-slate-400">(Dimension / Group By)</span>
                        </label>
                        <CustomSelect 
                          value={xAxis}
                          onChange={(val) => setXAxis(val)}
                          placeholder="Select column"
                          disabled={!selectedSheet}
                          options={columns.map(col => ({ value: col, label: col }))}
                        />
                      </div>
                    )}
                    
                    {!isMultiMeasure && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Y-Axis <span className="text-xs font-normal text-slate-400">(Measure)</span>
                        </label>
                        <CustomSelect 
                          value={yAxis}
                          onChange={(val) => setYAxis(val)}
                          placeholder="Select column"
                          disabled={!selectedSheet}
                          options={columns.map(col => ({ value: col, label: col }))}
                        />
                      </div>
                    )}
                  </div>

                  {/* Multi-Select Measures for Multi-Measure Charts */}
                  {isMultiMeasure && (
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Select Measures <span className="text-xs font-normal text-slate-400">(Y-Axes)</span>
                      </label>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
                        {columns.map(col => (
                          <label key={col} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                              checked={selectedColumns.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedColumns(prev => [...prev, col]);
                                else setSelectedColumns(prev => prev.filter(c => c !== col));
                              }}
                            />
                            <span className="ml-3 text-sm font-medium text-slate-700">{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aggregation */}
                  {!isMultiMeasure && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Aggregation Method</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['sum', 'average', 'count', 'segmentation']
                        .filter(agg => !(isLineChart && agg === 'segmentation'))
                        .map(agg => (
                        <button
                          key={agg}
                          onClick={() => setAggregation(agg)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            aggregation === agg 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {agg === 'segmentation' ? 'ABC Segment' : agg.charAt(0).toUpperCase() + agg.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Data Limit (Breakdown) */}
                  {!isSingleValue && aggregation !== 'segmentation' && !isMultiMeasure && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Data Breakdown Limit</label>
                      <select 
                        value={dataLimit}
                        onChange={(e) => setDataLimit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium"
                      >
                        <option value="top_20">Top 20 Items</option>
                        <option value="top_80_percent">Top 80% Cumulative Value (Pareto)</option>
                        <option value="top_90_percent">Top 90% Cumulative Value</option>
                        <option value="all">All Items (Capped at 50)</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">To keep charts visually clean, the maximum rendered items is capped at 50.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={
              !selectedSheet || 
              ((isTable || isMultiMeasure) && selectedColumns.length < (isBubble ? 3 : (isRadar ? 2 : 1))) ||
              (isMultiMeasure && !xAxis) ||
              (!isTable && !isMultiMeasure && ((!isSingleValue && aggregation !== 'segmentation' && !xAxis) || !yAxis)) || 
              isProcessing
            }
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center"
          >
            {isProcessing ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...</>
            ) : (
              'Save & Render'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
