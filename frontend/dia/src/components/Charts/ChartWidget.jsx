import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar, Bubble } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const dummyOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } },
    datalabels: { display: false } // Hide by default for other charts
  },
};

const getBarOptions = (isSegmentation = false) => ({
  indexAxis: isSegmentation ? 'x' : 'y', // Vertical for segmentation, horizontal for standard
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      display: true,
      align: 'end',
      anchor: 'end',
      color: '#475569',
      font: { size: 11, weight: '600' },
      formatter: (value) => {
        if (typeof value !== 'number') return value;
        return value >= 1000000 ? (value/1000000).toFixed(1) + 'M' 
             : value >= 1000 ? (value/1000).toFixed(1) + 'k' 
             : value.toLocaleString(undefined, {maximumFractionDigits: 1});
      }
    }
  },
  scales: {
    x: {
      display: isSegmentation, // Show category axis for vertical
      grid: { display: false },
      border: { display: false },
      ticks: isSegmentation ? {
        font: { size: 11, weight: '500' },
        color: '#334155',
        autoSkip: false
      } : undefined
    },
    y: {
      display: !isSegmentation,
      grid: { display: false },
      border: { display: false },
      ticks: !isSegmentation ? {
        font: { size: 11, weight: '500' },
        color: '#334155',
        autoSkip: false
      } : undefined
    }
  },
  layout: { padding: isSegmentation ? { top: 30 } : { right: 50 } } // Space for labels at the end of bars
});

const gaugeOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  circumference: 180,
  rotation: -90,
  cutout: '75%',
  plugins: { 
    legend: { display: false },
    datalabels: { display: false }
  },
  layout: { padding: 10 }
};

const getRadarOptions = (isConfigured) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: { 
      ticks: { display: false },
      grid: { color: '#e2e8f0' },
      pointLabels: {
        font: { size: 10, weight: '500' },
        color: '#64748b'
      }
    }
  },
  plugins: { 
    legend: { display: isConfigured, position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } }, 
    datalabels: { display: false } 
  }
});

const getBubbleOptions = (isConfigured) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: isConfigured, position: 'bottom' },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label: function(context) {
           const pt = context.raw;
           return `${pt.label || ''} (X: ${Number(pt.x).toLocaleString(undefined, {maximumFractionDigits: 1})}, Y: ${Number(pt.y).toLocaleString(undefined, {maximumFractionDigits: 1})})`;
        }
      }
    }
  }
});

const dummyDataBar = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{ 
    label: 'Sales', 
    data: [30, 70, 50, 90], 
    backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'], 
    borderRadius: 6,
    barPercentage: 0.5
  }]
};

const dummyDataLine = {
  labels: ['W1', 'W2', 'W3', 'W4'],
  datasets: [{ label: 'Traffic', data: [20, 50, 30, 60], borderColor: '#6366f1', backgroundColor: '#6366f1', borderWidth: 2, tension: 0.4 }]
};

const dummyDataPie = {
  labels: ['Alpha', 'Beta', 'Gamma'],
  datasets: [{ data: [45, 25, 30], backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6'], borderWidth: 1 }]
};

const dummyDataGauge = {
  labels: ['Score', 'Remaining'],
  datasets: [{ data: [75, 25], backgroundColor: ['#10b981', '#f1f5f9'], borderWidth: 0 }]
};

const dummyDataRadar = {
  labels: ['Price', 'Quality', 'Speed', 'Support', 'Features'],
  datasets: [{
    label: 'Product A',
    data: [65, 90, 70, 80, 85],
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
    borderWidth: 2
  }]
};

const dummyDataBubble = {
  datasets: [{
    label: 'Campaigns',
    data: [
      { x: 20, y: 30, r: 15 },
      { x: 40, y: 10, r: 10 },
      { x: 25, y: 50, r: 25 },
      { x: 60, y: 40, r: 20 }
    ],
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
    borderColor: '#3b82f6'
  }]
};

const dummyDataTable = [
  { id: 1, name: 'Acme Corp', status: 'Active', revenue: '$14,000' },
  { id: 2, name: 'Globex', status: 'Pending', revenue: '$8,500' },
  { id: 3, name: 'Soylent', status: 'Active', revenue: '$22,000' },
  { id: 4, name: 'Initech', status: 'Closed', revenue: '$3,200' },
];

const renderPreview = (type, widget) => {
  const isConfigured = !!widget?.config;
  const config = widget?.config;
  
  const labels = isConfigured && config.labels ? config.labels : [];
  const dataValues = isConfigured && config.dataValues ? config.dataValues : [];
  
  const isSegmentation = config?.aggregation === 'segmentation';

  // Real Data Generators
  const realDataBar = {
    labels,
    datasets: [{ 
      label: config?.yAxis || 'Value', 
      data: dataValues, 
      backgroundColor: isSegmentation 
        ? ['#4ade80', '#60a5fa', '#fbbf24'] // Green, Blue, Yellow for ABC Segments
        : '#334155', // IBCS Solid Dark Grey for Actuals
      borderRadius: 4,
      barPercentage: 0.7
    }]
  };

  const realDataLine = {
    labels,
    datasets: [{ 
      label: config?.yAxis || 'Value', 
      data: dataValues, 
      borderColor: '#6366f1', 
      backgroundColor: '#6366f1', 
      borderWidth: 2, 
      tension: 0.4 
    }]
  };

  const realDataPie = {
    labels,
    datasets: [{ 
      data: dataValues, 
      // Generate some random colors or use a preset palette
      backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'], 
      borderWidth: 1 
    }]
  };

  const radarColors = [
    { bg: 'rgba(99, 102, 241, 0.2)', border: '#6366f1' },
    { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' },
    { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b' },
    { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444' },
    { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' }
  ];

  const isRadarConfigured = !!config?.radarData;
  const realDataRadar = isRadarConfigured ? {
    labels: config.radarData.labels,
    datasets: config.radarData.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: radarColors[i % radarColors.length].bg,
      borderColor: radarColors[i % radarColors.length].border,
      borderWidth: 2
    }))
  } : dummyDataRadar;

  switch (type) {
    case 'kpi': {
      // If configured, calculate a single KPI value (e.g. sum of all aggregates)
      let kpiValue = '478';
      let kpiTitle = 'Total Suppliers';
      
      if (isConfigured) {
        kpiTitle = config.title;
        const total = dataValues.reduce((sum, val) => sum + val, 0);
        kpiValue = total >= 1000000 
          ? (total/1000000).toFixed(1) + 'M' 
          : total >= 1000 
          ? (total/1000).toFixed(1) + 'k' 
          : total?.toLocaleString(undefined, {maximumFractionDigits: 1});
      }
      
      return (
        <div className="flex flex-col w-full h-full bg-white p-3 sm:p-5 cursor-pointer justify-center items-center shadow-[0px_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 rounded-2xl overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <span className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#006085] tracking-tight leading-none w-full text-center break-words shrink" title={kpiValue}>
            {kpiValue}
          </span>
          <span className="text-xs md:text-[13px] font-semibold text-[#5a7684] mt-1.5 md:mt-2.5 w-full text-center line-clamp-2" title={kpiTitle}>
            {kpiTitle}
          </span>
        </div>
      );
    }
    case 'table': {
      const isTableConfigured = !!widget?.config?.tableData;
      const tableData = widget?.config?.tableData || [];
      const cols = widget?.config?.selectedColumns || [];

      return (
        <div className="w-full h-full overflow-auto bg-white rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm">
              <tr>
                {isTableConfigured ? (
                  cols.map(c => (
                    <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
                  ))
                ) : (
                  <>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isTableConfigured ? (
                tableData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {cols.map(c => (
                      <td key={c} className="px-4 py-3 font-medium text-gray-700 truncate max-w-[250px]" title={row[c]}>
                        {!isNaN(row[c]) && row[c] !== '' && row[c] !== null
                          ? Number(row[c]).toLocaleString(undefined, {maximumFractionDigits: 2})
                          : row[c]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                dummyDataTable.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{row.revenue}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }
    case 'bar': return <Bar data={isConfigured ? realDataBar : dummyDataBar} options={getBarOptions(isSegmentation)} />;
    case 'line': return <Line data={isConfigured ? realDataLine : dummyDataLine} options={dummyOptions} />;
    case 'pie': return <Pie data={isConfigured ? realDataPie : dummyDataPie} options={dummyOptions} />;
    case 'doughnut': return <Doughnut data={isConfigured ? realDataPie : dummyDataPie} options={dummyOptions} />;
    case 'radar': return <Radar data={isRadarConfigured ? realDataRadar : dummyDataRadar} options={getRadarOptions(isRadarConfigured)} />;
    case 'bubble': return <Bubble data={isConfigured && config.bubbleData ? config.bubbleData : dummyDataBubble} options={getBubbleOptions(isConfigured)} />;
    case 'speedometer': {
      const speedoValue = isConfigured ? (dataValues[0] || 0) : 75;
      const speedoFormat = speedoValue >= 1000000 
          ? (speedoValue/1000000).toFixed(1) + 'M' 
          : speedoValue >= 1000 
          ? (speedoValue/1000).toFixed(1) + 'k' 
          : speedoValue?.toLocaleString(undefined, {maximumFractionDigits: 1});
      
      const speedoTitle = isConfigured ? config.title : 'Score';
      const gaugeMax = speedoValue > 100 ? speedoValue : 100;
      const visualFill = speedoValue > 100 ? 100 : speedoValue;
      
      const activeDataGauge = {
        labels: ['Score', 'Remaining'],
        datasets: [{ data: [visualFill, 100 - visualFill], backgroundColor: ['#10b981', '#f1f5f9'], borderWidth: 0 }]
      };

      return (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div 
            className="relative flex items-end justify-center" 
            style={{ 
              aspectRatio: '2/1', 
              maxWidth: '100%', 
              maxHeight: '100%',
              width: 'auto',
              height: '100%'
            }}
          >
             <Doughnut data={activeDataGauge} options={{...gaugeOptions, maintainAspectRatio: false}} />
             <div className="absolute bottom-[8%] flex flex-col items-center z-10 pointer-events-none">
               <span className="text-3xl font-black text-gray-800 leading-none truncate max-w-[120px] text-center" title={speedoValue}>{speedoFormat}</span>
               <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5 truncate max-w-[120px] text-center" title={speedoTitle}>{speedoTitle}</span>
             </div>
          </div>
        </div>
      );
    }
    case 'funnel': {
      const funnelData = isConfigured && config.aggregatedData ? config.aggregatedData : [
        { label: 'Leads', value: 5000 },
        { label: 'Qualified', value: 2100 },
        { label: 'Proposals', value: 800 },
        { label: 'Wins', value: 250 },
      ];
      const maxVal = Math.max(...funnelData.map(d => d.value));
      const colors = ['bg-indigo-500', 'bg-indigo-400', 'bg-indigo-300', 'bg-emerald-400', 'bg-emerald-300'];
      
      return (
        <div className="flex flex-col items-center w-full h-full justify-center space-y-1.5 p-4 overflow-y-auto">
          {funnelData.slice(0, 7).map((d, i) => {
            const pct = maxVal > 0 ? (d.value / maxVal) * 90 : 10;
            return (
              <div key={i} style={{ width: `${Math.max(pct, 15)}%` }} className={`h-8 ${colors[i % colors.length]} rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform shrink-0`}>
                <span className="drop-shadow-sm truncate mr-2" title={String(d.label)}>{String(d.label)}</span>
                <span className="drop-shadow-sm">{Number(d.value).toLocaleString(undefined, {maximumFractionDigits: 1})}</span>
              </div>
            );
          })}
        </div>
      );
    }
    default: return null;
  }
};

export default function ChartWidget({ widget, onConfigure, onRemove, isReadonly = false }) {
  const isConfigured = !!widget.config;

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative group ${widget.type === 'kpi' && !isReadonly ? 'cursor-move grid-stack-drag-handle' : ''}`}>
      
      {/* Configuration Tools (Absolute for KPIs, in Header for others) */}
      {widget.type === 'kpi' && !isReadonly && (
        <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button onClick={(e) => { e.stopPropagation(); onConfigure(widget.id); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded bg-white shadow-sm border border-gray-100" title="Configure Data">
            <i className="fa-solid fa-gear text-xs"></i>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded bg-white shadow-sm border border-gray-100" title="Remove Widget">
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      )}

      {/* Header (Hidden for KPIs) */}
      {widget.type !== 'kpi' && (
        <div className={`h-11 border-b border-slate-100/80 flex items-center justify-between px-4 bg-white shrink-0 ${!isReadonly ? 'cursor-move grid-stack-drag-handle' : ''}`}>
          <h3 className="text-[13px] font-semibold text-slate-600 truncate pr-2">
            {isConfigured ? widget.config.title : `New ${widget.type.toUpperCase()}`}
          </h3>
          
          {!isReadonly && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onConfigure(widget.id); }}
                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Configure Data"
              >
                <i className="fa-solid fa-gear text-xs"></i>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Remove Widget"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={`flex-1 overflow-hidden relative group/body ${widget.type === 'kpi' ? 'p-0' : 'p-4'}`}>
        {!isConfigured ? (
          <>
            {/* The chart preview */}
             <div className={`w-full h-full ${!isReadonly ? 'opacity-50 pointer-events-none transition-opacity filter grayscale-[0.3]' : ''}`}>
                {renderPreview(widget.type, widget)}
             </div>
            
            {/* Overlay button on hover (Only in Builder) */}
            {!isReadonly && (
              <div className="absolute inset-0 bg-white/30 flex items-center justify-center opacity-0 group-hover/body:opacity-100 transition-opacity backdrop-blur-[1px]">
                <button 
                  onClick={() => onConfigure(widget.id)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 flex items-center"
                >
                  <i className="fa-solid fa-database mr-2"></i>
                  Connect Data
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full">
             {renderPreview(widget.type, widget)}
          </div>
        )}
      </div>

    </div>
  );
}
