import { useState, useRef } from 'react';

export default function DataUploader({ onDataLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    setIsUploading(true);
    
    setTimeout(() => {
      setIsUploading(false);
      if (onDataLoaded) {
        onDataLoaded({
          name: selectedFile.name,
          columns: ['Date', 'Revenue', 'Cost', 'Region', 'Product', 'Quantity']
        });
      }
    }, 1500);
  };

  if (file && !isUploading) {
    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mr-3 shrink-0">
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-800 truncate">{file.name}</h4>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Successfully Loaded</p>
          </div>
          <button 
            onClick={() => { setFile(null); if(onDataLoaded) onDataLoaded(null); }}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-700">Detected Columns</h3>
            <p className="text-xs text-slate-500">Available for mapping</p>
          </div>
          <div className="p-3 overflow-y-auto space-y-2 flex-1">
            {['Date', 'Revenue', 'Cost', 'Region', 'Product', 'Quantity'].map((col, idx) => (
              <div key={idx} className="flex items-center p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group cursor-grab">
                <i className="fa-solid fa-grip-vertical text-slate-300 mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 text-xs ${idx === 0 ? 'bg-blue-100 text-blue-600' : (idx === 3 || idx === 4) ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <i className={`fa-solid ${idx === 0 ? 'fa-calendar-days' : (idx === 3 || idx === 4) ? 'fa-font' : 'fa-hashtag'}`}></i>
                </div>
                <span className="text-sm font-semibold text-slate-700">{col}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-center">
      <div 
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 text-center
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileSelect}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700">Parsing data locally...</p>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${isDragging ? 'bg-indigo-600 scale-110 text-white shadow-lg shadow-indigo-500/30' : 'bg-white shadow-sm text-indigo-500'}`}>
              <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Upload Data</h3>
            <p className="text-sm text-slate-500 mb-6">Drag & drop your Excel or CSV file here</p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-slate-200 shadow-sm hover:shadow text-slate-700 font-semibold text-sm px-6 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
            >
              Browse Files
            </button>
            <p className="text-xs text-slate-400 mt-4 font-medium">100% Client-Side. No data is sent to our servers.</p>
          </>
        )}
      </div>
    </div>
  );
}
