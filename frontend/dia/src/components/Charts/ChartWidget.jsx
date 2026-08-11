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
  Legend
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

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      display: false
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false }
    },
    y: {
      grid: { color: '#f1f5f9' },
      border: { display: false }
    }
  },
  layout: { padding: { top: 20 } } // Space for data labels
};

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

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: { 
      ticks: { display: false },
      grid: { color: '#e2e8f0' }
    }
  },
  plugins: { legend: { display: false }, datalabels: { display: false } }
};

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
  switch (type) {
    case 'kpi':
      const kpiValue = widget?.config?.value || '478';
      const kpiTitle = widget?.config?.title || 'Total Suppliers';
      return (
        <div className="flex flex-col w-full h-full relative bg-white p-5 cursor-pointer">
          {/* Interactive Top Border Line */}
          <div className="absolute top-0 left-0 h-1 w-0 bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-full transition-all duration-500 ease-out z-20"></div>
          
          <div className="flex justify-between items-start h-full">
            <div className="flex flex-col justify-center h-full z-10">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors duration-300">{kpiTitle}</span>
              <span className="text-[2.75rem] font-black text-slate-800 tracking-tighter leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-violet-500 transition-all duration-300">{kpiValue}</span>
            </div>
            
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100 mt-1">
               <i className="fa-solid fa-chart-pie text-xl text-slate-300 group-hover:text-indigo-500 transition-colors duration-300"></i>
            </div>
          </div>
          
          {/* Ambient Hover Glow */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"></div>
        </div>
      );
    case 'table':
      return (
        <div className="w-full h-full overflow-auto bg-white rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dummyDataTable.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${row.status === 'Active' ? 'bg-green-100 text-green-700' : row.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'bar': return <Bar data={dummyDataBar} options={barOptions} />;
    case 'line': return <Line data={dummyDataLine} options={dummyOptions} />;
    case 'pie': return <Pie data={dummyDataPie} options={dummyOptions} />;
    case 'doughnut': return <Doughnut data={dummyDataPie} options={dummyOptions} />;
    case 'radar': return <Radar data={dummyDataRadar} options={radarOptions} />;
    case 'bubble': return <Bubble data={dummyDataBubble} options={{...dummyOptions, plugins: { legend: {display: false}, datalabels: {display: false} }}} />;
    case 'speedometer': 
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
             <Doughnut data={dummyDataGauge} options={{...gaugeOptions, maintainAspectRatio: false}} />
             <div className="absolute bottom-[8%] flex flex-col items-center z-10 pointer-events-none">
               <span className="text-3xl font-black text-gray-800 leading-none">75</span>
               <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">Score</span>
             </div>
          </div>
        </div>
      );
    case 'funnel':
      return (
        <div className="flex flex-col items-center w-full h-full justify-center space-y-1.5 p-4">
          <div className="w-[90%] h-8 bg-indigo-500 rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform"><span className="drop-shadow-sm">Leads</span><span className="drop-shadow-sm">5,000</span></div>
          <div className="w-[70%] h-8 bg-indigo-400 rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform"><span className="drop-shadow-sm">Qualified</span><span className="drop-shadow-sm">2,100</span></div>
          <div className="w-[50%] h-8 bg-indigo-300 rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform"><span className="drop-shadow-sm">Proposals</span><span className="drop-shadow-sm">800</span></div>
          <div className="w-[35%] h-8 bg-emerald-400 rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform"><span className="drop-shadow-sm">Wins</span><span className="drop-shadow-sm">250</span></div>
        </div>
      );
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
