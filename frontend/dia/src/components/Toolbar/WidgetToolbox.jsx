import { useEffect } from 'react';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const previewOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  animation: false,
  layout: { padding: 0 }
};

const dummyDataBar = {
  labels: ['1', '2', '3'],
  datasets: [{ data: [3, 7, 5], backgroundColor: ['#60a5fa', '#6366f1', '#c084fc'], borderRadius: 2 }]
};

const dummyDataLine = {
  labels: ['1', '2', '3', '4'],
  datasets: [{ data: [2, 5, 3, 6], borderColor: '#6366f1', borderWidth: 3, pointRadius: 0, tension: 0.4 }]
};

const dummyDataPie = {
  labels: ['1', '2', '3'],
  datasets: [{ data: [45, 25, 30], backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6'], borderWidth: 0 }]
};

const Previews = {
  kpi: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50/50 rounded-lg">
      <span className="text-2xl font-black text-indigo-600">84%</span>
      <span className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">Growth</span>
    </div>
  ),
  table: () => (
    <div className="flex flex-col w-full h-full bg-gray-50/50 rounded-lg p-2 space-y-1 justify-center">
      <div className="w-full h-2 bg-gray-300 rounded-[2px]"></div>
      <div className="w-full h-2 bg-indigo-200 rounded-[2px]"></div>
      <div className="w-full h-2 bg-gray-200 rounded-[2px]"></div>
      <div className="w-full h-2 bg-indigo-100 rounded-[2px]"></div>
    </div>
  ),
  bar: () => (
    <div className="w-full h-full p-2 bg-gray-50/50 rounded-lg">
      <Bar data={dummyDataBar} options={previewOptions} />
    </div>
  ),
  line: () => (
    <div className="w-full h-full p-2 bg-gray-50/50 rounded-lg">
      <Line data={dummyDataLine} options={previewOptions} />
    </div>
  ),
  pie: () => (
    <div className="w-full h-full p-2 bg-gray-50/50 rounded-lg">
      <Pie data={dummyDataPie} options={previewOptions} />
    </div>
  ),
  doughnut: () => (
    <div className="w-full h-full p-2 bg-gray-50/50 rounded-lg">
      <Doughnut data={dummyDataPie} options={previewOptions} />
    </div>
  ),
  speedometer: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50/50 rounded-lg p-1 overflow-hidden relative">
      <div className="w-8 h-4 bg-gray-300 rounded-t-full border-b-2 border-gray-400"></div>
      <div className="absolute w-0.5 h-3 bg-red-400 rotate-45 transform origin-bottom translate-x-1 translate-y-[-2px]"></div>
    </div>
  ),
  funnel: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50/50 rounded-lg p-2 space-y-[2px]">
      <div className="w-full h-1.5 bg-indigo-400 rounded-sm"></div>
      <div className="w-4/5 h-1.5 bg-indigo-300 rounded-sm"></div>
      <div className="w-3/5 h-1.5 bg-indigo-200 rounded-sm"></div>
      <div className="w-2/5 h-1.5 bg-emerald-300 rounded-sm"></div>
    </div>
  ),
  radar: () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-50/50 rounded-lg p-2">
      <div className="w-6 h-6 border-2 border-indigo-200 rounded-full flex items-center justify-center rotate-45">
        <div className="w-3 h-3 bg-indigo-400/50 rounded-full"></div>
      </div>
    </div>
  ),
  bubble: () => (
    <div className="flex items-center w-full h-full bg-gray-50/50 rounded-lg p-2 relative">
      <div className="absolute left-2 bottom-2 w-3 h-3 rounded-full bg-blue-400/60 border border-blue-500"></div>
      <div className="absolute right-3 top-2 w-4 h-4 rounded-full bg-indigo-400/60 border border-indigo-500"></div>
      <div className="absolute left-5 top-4 w-2 h-2 rounded-full bg-purple-400/60 border border-purple-500"></div>
    </div>
  )
};

export default function WidgetToolbox({ onAddWidget }) {
  useEffect(() => {
    // Make these items draggable into GridStack
    GridStack.setupDragIn('.new-widget', { 
      revert: 'invalid', 
      scroll: false, 
      appendTo: 'body', 
      helper: 'clone' 
    });
  }, []);

  const chartTypes = [
    { type: 'kpi', label: 'KPI Card', w: 2, h: 2 },
    { type: 'table', label: 'Data Table', w: 6, h: 4 },
    { type: 'bar', label: 'Bar Chart', w: 4, h: 3 },
    { type: 'line', label: 'Line Chart', w: 6, h: 3 },
    { type: 'pie', label: 'Pie Chart', w: 4, h: 3 },
    { type: 'doughnut', label: 'Doughnut Chart', w: 4, h: 3 },
    { type: 'speedometer', label: 'Speedometer', w: 4, h: 3 },
    { type: 'funnel', label: 'Funnel Chart', w: 4, h: 3 },
    { type: 'radar', label: 'Radar Chart', w: 4, h: 4 },
    { type: 'bubble', label: 'Bubble Chart', w: 6, h: 4 },
  ];

  return (
    <div className="flex flex-col h-full bg-white divide-y divide-gray-100 overflow-y-auto">


      {/* Components Section */}
      <div className="flex flex-col">
        <div className="p-4 pb-2 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Chart Library</h2>
          <p className="text-xs text-gray-500 mt-1">Drag previews to canvas</p>
        </div>
        <div className="p-4 pt-3 grid grid-cols-2 gap-3">
          {chartTypes.map((item) => (
            <div 
              key={item.type}
              className="new-widget grid-stack-item bg-white hover:bg-white border border-gray-200 hover:border-indigo-400 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md flex flex-col items-center justify-center text-center group"
              data-type={item.type}
              gs-w={item.w}
              gs-h={item.h}
              onClick={() => onAddWidget(item.type, item.w, item.h)}
            >
              <div className="grid-stack-item-content w-full !static !bg-transparent !border-none !shadow-none p-0 flex flex-col items-center pointer-events-none">
                <div className="w-full h-16 mb-2">
                   {Previews[item.type]()}
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
