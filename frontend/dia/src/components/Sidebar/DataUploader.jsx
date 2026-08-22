import { useState, useRef } from 'react';
import localforage from 'localforage';
import { parseWorkbookFile, toSchemaPayload } from '../../utils/excelParser';
import { apiRequest, getToken } from '../../utils/api';
import { RAW_DATA_KEY } from '../../utils/aggregate';
import { DEMO_MODE } from '../../utils/demo';

const UNKNOWN_SOURCE = 'Earlier upload';

export default function DataUploader({ onDataLoaded, onDataRemoved, loadedDataSheets = [] }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [expandedSheet, setExpandedSheet] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const syncSchema = async (sheets) => {
    if (DEMO_MODE) return;
    try {
      if (sheets.length > 0) {
        await apiRequest('/api/schema', { method: 'POST', body: toSchemaPayload(sheets) });
      } else {
        await apiRequest('/api/schema', { method: 'DELETE' });
      }
    } catch (syncErr) {
      setWarning(`Data updated locally, but column names could not be synced: ${syncErr.message}`);
    }
  };

  const handleFile = async (selectedFile) => {
    setIsUploading(true);
    setError(null);
    setWarning(null);

    try {
      if (!DEMO_MODE && !getToken()) throw new Error('You must be logged in to load data.');

      // Everything about the rows happens here, in the browser.
      const parsedSheets = await parseWorkbookFile(selectedFile);

      // Merge with already-loaded files: re-uploading the same file replaces its sheets;
      // a sheet name that collides with another file's sheet gets the file name appended.
      const existing = (await localforage.getItem(RAW_DATA_KEY)) || [];
      const remaining = existing.filter(s => s.sourceFile !== selectedFile.name);
      const takenNames = new Set(remaining.map(s => s.sheetName));
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
      const stamped = parsedSheets.map(s => {
        let sheetName = s.sheetName;
        if (takenNames.has(sheetName)) sheetName = `${sheetName} (${baseName})`;
        takenNames.add(sheetName);
        return { ...s, sheetName, sourceFile: selectedFile.name };
      });
      const merged = [...remaining, ...stamped];

      await localforage.setItem(RAW_DATA_KEY, merged);
      setExpandedSheet(stamped[0]?.sheetName || null);
      onDataLoaded?.({ name: selectedFile.name, sheets: merged, refresh: true });

      // Only sheet names and column headers are synced; row data never leaves the device.
      await syncSchema(merged);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (fileName) => {
    if (!window.confirm(`Remove "${fileName}" from this browser? Charts built from it keep their current values.`)) return;
    setIsRemoving(true);
    setError(null);
    setWarning(null);
    try {
      const existing = (await localforage.getItem(RAW_DATA_KEY)) || [];
      const merged = existing.filter(s => (s.sourceFile || UNKNOWN_SOURCE) !== fileName);
      if (merged.length > 0) {
        await localforage.setItem(RAW_DATA_KEY, merged);
        onDataLoaded?.({ name: null, sheets: merged, refresh: false });
      } else {
        await localforage.removeItem(RAW_DATA_KEY);
        onDataRemoved?.();
      }
      await syncSchema(merged);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!window.confirm('Remove all loaded data from this browser? Configured charts keep their current values until you load a new file.')) return;
    setIsRemoving(true);
    setError(null);
    setWarning(null);
    try {
      await localforage.removeItem(RAW_DATA_KEY);
      await syncSchema([]);
      setExpandedSheet(null);
      onDataRemoved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const activeSheets = loadedDataSheets || [];
  const hasActiveData = activeSheets.length > 0 && !isUploading;

  // Group sheets by the file they came from.
  const fileGroups = activeSheets.reduce((map, sheet) => {
    const source = sheet.sourceFile || UNKNOWN_SOURCE;
    (map[source] = map[source] || []).push(sheet);
    return map;
  }, {});
  const fileNames = Object.keys(fileGroups);

  const fileInput = (
    <input
      type="file"
      ref={fileInputRef}
      className="hidden"
      accept=".csv,.tsv,.txt,.xlsx,.xlsm,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      onChange={handleFileSelect}
    />
  );

  if (hasActiveData) {
    return (
      <div className="flex flex-col h-full space-y-4">
        {fileInput}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mx-2 mt-2 text-sm text-red-700 font-medium">{error}</div>
        )}
        {warning && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-md mx-2 mt-2 text-xs text-amber-800 font-medium">{warning}</div>
        )}

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mx-2 mt-2">
          <div className="flex items-start">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mr-3 shrink-0">
              <i className="fa-solid fa-database"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-800">Workspace data</h4>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {fileNames.length} file{fileNames.length === 1 ? '' : 's'} · {activeSheets.length} sheet{activeSheets.length === 1 ? '' : 's'} · stored only in this browser
              </p>
            </div>
          </div>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRemoving || isUploading}
              className="flex-1 bg-white border border-emerald-200 hover:border-emerald-400 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              title="Load another Excel/CSV file. Re-uploading a file with the same name replaces it and recalculates its charts."
            >
              {isUploading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-plus mr-1.5"></i>Add file</>}
            </button>
            <button
              onClick={handleRemoveAll}
              disabled={isRemoving || isUploading}
              className="flex-1 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              title="Delete all loaded rows from this browser and the stored column names from the server."
            >
              {isRemoving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-trash mr-1.5"></i>Remove all</>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-2">
          {fileNames.map(fileName => (
            <div key={fileName}>
              <div className="flex items-center justify-between px-1 mb-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate flex items-center min-w-0">
                  <i className="fa-solid fa-file-excel text-emerald-500 mr-2"></i>
                  <span className="truncate" title={fileName}>{fileName}</span>
                </h5>
                <button
                  onClick={() => handleRemoveFile(fileName)}
                  disabled={isRemoving}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
                  title={`Remove ${fileName}`}
                >
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>
              </div>

              <div className="space-y-2">
                {fileGroups[fileName].map((sheet) => (
                  <div key={sheet.sheetName} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div
                      className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setExpandedSheet(expandedSheet === sheet.sheetName ? null : sheet.sheetName)}
                    >
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center truncate">
                          <i className="fa-regular fa-folder-open text-indigo-500 mr-2"></i>
                          {sheet.sheetName}
                        </h3>
                        <p className="text-xs text-slate-500 ml-6">{sheet.headers.length} columns · {sheet.data?.length ?? 0} rows</p>
                      </div>
                      <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform ${expandedSheet === sheet.sheetName ? 'rotate-180' : ''}`}></i>
                    </div>

                    {expandedSheet === sheet.sheetName && (
                      <div className="p-2 overflow-y-auto max-h-60 space-y-1">
                        {sheet.headers.map((col, colIdx) => (
                          <div key={colIdx} className="flex items-center p-2 rounded-lg hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-colors group">
                            <div className="w-6 h-6 rounded flex items-center justify-center mr-3 text-xs bg-indigo-50 text-indigo-600">
                              <i className="fa-solid fa-hashtag"></i>
                            </div>
                            <span className="text-sm font-semibold text-slate-700 truncate">{col}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-center">
      {fileInput}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md mx-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
      <div
        className={`relative flex flex-col items-center justify-center px-4 py-8 mx-2 border-2 border-dashed rounded-2xl transition-all duration-300 text-center whitespace-normal
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-transparent hover:bg-slate-50/50 hover:border-slate-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#1e293b]">Parsing data locally...</p>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${isDragging ? 'bg-indigo-600 scale-110 text-white shadow-lg shadow-indigo-500/30' : 'bg-white shadow-sm text-[#6366f1]'}`}>
              <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            </div>
            <h3 className="text-base font-bold text-[#1e293b] mb-1">Load Data</h3>
            <p className="text-sm text-[#64748b] mb-6">Drag & drop your Excel or CSV file here.<br/>You can add more files afterwards.</p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-slate-200 shadow-sm hover:shadow text-[#1e293b] font-semibold text-sm px-6 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
            >
              Browse Files
            </button>
            <p className="text-xs text-[#94a3b8] mt-4 font-medium">Rows are parsed and stored in this browser only. Only sheet names and column headers are sent to our servers.</p>
          </>
        )}
      </div>
    </div>
  );
}
