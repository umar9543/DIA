import { useEffect, useRef, useState } from 'react';
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
import { getTheme, withAlpha } from '../../utils/themes';

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

// Scales its font so the text always fits its parent on one line — KPI cards
// get resized freely and a fixed font size wraps or overflows.
const AutoFitText = ({ text, className, color, maxPx = 44, minPx = 12 }) => {
  const ref = useRef(null);
  const [size, setSize] = useState(maxPx);

  useEffect(() => {
    const el = ref.current;
    if (!el || !el.parentElement) return;
    const parent = el.parentElement;
    const fit = () => {
      const availW = el.clientWidth;      // span is w-full inside the padded card
      const h = parent.clientHeight;
      if (!availW || !h) return;
      // Measure the real rendered width of the text at 100px in the span's font.
      const cs = getComputedStyle(el);
      const ctx = (AutoFitText._canvas || (AutoFitText._canvas = document.createElement('canvas'))).getContext('2d');
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
      const w100 = ctx.measureText(String(text)).width || 1;
      const byWidth = (availW * 0.96 * 100) / w100;
      const byHeight = h * 0.45; // leave room for the label below
      setSize(Math.round(Math.max(minPx, Math.min(maxPx, byWidth, byHeight))));
    };
    fit();
    // GridStack sizes the card a tick after mount; re-check once layout settled.
    const raf = requestAnimationFrame(() => requestAnimationFrame(fit));
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [text, maxPx, minPx]);

  return (
    <span ref={ref} className={className} style={{ fontSize: size + 'px', lineHeight: 1.05, color }} title={String(text)}>
      {text}
    </span>
  );
};

const TableSearch = ({ value, onChange }) => (
  <div className="px-2 pt-2 pb-1.5 bg-white shrink-0" data-export-hide>
    <div className="relative">
      <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search rows…"
        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-400 placeholder:text-slate-400"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" title="Clear search">
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      )}
    </div>
  </div>
);

// Configured flat table with client-side row search across all shown columns.
const FlatTable = ({ cols, rows }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((r) => cols.some((c) => String(r[c] ?? '').toLowerCase().includes(q))) : rows;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg">
      <TableSearch value={query} onChange={setQuery} />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm">
            <tr>
              {cols.map(c => (
                <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-xs font-medium text-slate-400">No rows match "{query.trim()}"</td></tr>
            ) : visible.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {cols.map(c => (
                  <td key={c} className="px-4 py-3 font-medium text-gray-700 truncate max-w-[250px]" title={row[c]}>
                    {!isNaN(row[c]) && row[c] !== '' && row[c] !== null
                      ? Number(row[c]).toLocaleString(undefined, {maximumFractionDigits: 2})
                      : row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Expandable pivot table: indented rows, chevron per group, count + one column per measure.
const TreeTable = ({ tree, totalCount, totalSums, measureLabels, level1Shown, level1Total, deepTruncated }) => {
  const [open, setOpen] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const fmt = (v) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 });
  // Trees saved before multi-measure support store a single `sum` per node.
  const sumsOf = (n) => n.sums || (n.sum != null ? [n.sum] : []);
  const nMeasures = measureLabels.length;

  // Search keeps any branch containing a match (ancestors included); a matched
  // group keeps all its children so its breakdown stays intact.
  const q = query.trim().toLowerCase();
  const filterNodes = (nodes) => nodes
    .map((n) => {
      const selfMatch = String(n.label).toLowerCase().includes(q);
      const kids = filterNodes(n.children);
      if (!selfMatch && kids.length === 0) return null;
      return { ...n, children: selfMatch ? n.children : kids };
    })
    .filter(Boolean);
  const visibleTree = q ? filterNodes(tree) : tree;
  // While searching, the footer totals the matching branches, not the whole dataset.
  const shownCount = q ? visibleTree.reduce((acc, n) => acc + n.count, 0) : totalCount;
  const shownSums = q
    ? measureLabels.map((_, i) => visibleTree.reduce((acc, n) => acc + (sumsOf(n)[i] || 0), 0))
    : (totalSums || []);
  const level1Hidden = level1Total > level1Shown ? level1Total - level1Shown : 0;
  const isTruncated = level1Hidden > 0 || deepTruncated;

  const rows = [];
  const walk = (nodes, depth, path) => {
    nodes.forEach((n) => {
      const key = path + '::' + n.label;
      const isOpen = q ? true : open.has(key); // search shows matches expanded
      rows.push({ node: n, depth, key, isOpen });
      if (isOpen && n.children.length > 0) walk(n.children, depth + 1, key);
    });
  };
  walk(visibleTree, 0, '');

  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg">
      <TableSearch value={query} onChange={setQuery} />
      {isTruncated && !q && (
        <div className="px-3 py-1.5 bg-amber-50 border-y border-amber-100 text-[11px] font-medium text-amber-700 shrink-0" data-export-hide>
          <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
          {level1Hidden > 0
            ? `Showing the top ${level1Shown.toLocaleString()} of ${level1Total.toLocaleString()} groups (ranked by value).`
            : 'Some deeper groups are hidden by the display limit.'}
        </div>
      )}
      <div className="flex-1 overflow-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm z-10">
          <tr>
            <th className="px-4 py-3 font-semibold">Group</th>
            <th className="px-4 py-3 font-semibold text-right w-24">Rows</th>
            {measureLabels.map((label) => (
              <th key={label} className="px-4 py-3 font-semibold text-right whitespace-nowrap">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {q && rows.length === 0 && (
            <tr><td colSpan={2 + nMeasures} className="px-4 py-6 text-center text-xs font-medium text-slate-400">
              No groups match "{query.trim()}"
              {isTruncated && (
                <span className="block mt-1 text-amber-600">
                  Note: {level1Hidden > 0 ? `${level1Hidden.toLocaleString()} groups are hidden by the display limit` : 'some deeper groups are hidden by the display limit'} and cannot be searched. Try a hierarchy that starts with a broader column (e.g. Applicant before Requisition No.).
                </span>
              )}
            </td></tr>
          )}
          {rows.map(({ node, depth, key, isOpen }) => (
            <tr
              key={key}
              className={`hover:bg-brand-50/40 transition-colors ${node.children.length > 0 ? 'cursor-pointer' : ''} ${depth === 0 ? 'bg-slate-50/60' : ''}`}
              onClick={() => node.children.length > 0 && toggle(key)}
            >
              <td className="px-4 py-2.5 font-medium text-gray-700">
                <span className="flex items-center" style={{ paddingLeft: depth * 18 + 'px' }}>
                  {node.children.length > 0 ? (
                    <i className={`fa-solid fa-chevron-right text-[9px] mr-2 text-brand-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>
                  ) : (
                    <span className="w-[13px] mr-2 inline-block"></span>
                  )}
                  <span className={depth === 0 ? 'font-semibold text-gray-800' : ''}>{node.label}</span>
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmt(node.count)}</td>
              {measureLabels.map((label, i) => (
                <td key={label} className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-700">{fmt(sumsOf(node)[i] || 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0">
          <tr className="bg-gray-50 border-t-2 border-gray-200 text-xs font-bold text-gray-700 uppercase">
            <td className="px-4 py-2.5">{q ? 'Total (filtered)' : 'Total'}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{fmt(shownCount)}</td>
            {measureLabels.map((label, i) => (
              <td key={label} className="px-4 py-2.5 text-right tabular-nums">{fmt(shownSums[i] || 0)}</td>
            ))}
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
};

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
  datasets: [{ label: 'Traffic', data: [20, 50, 30, 60], borderColor: '#274F91', backgroundColor: '#274F91', borderWidth: 2, tension: 0.4 }]
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
    borderColor: '#274F91',
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

const renderPreview = (type, widget, theme) => {
  const config = widget?.config;
  // Only data-bound configs (built from a sheet) count as configured. Template
  // widgets carry a display-only placeholder config ({ title, value }) with no
  // computed data — those must keep rendering the dummy preview, not an empty chart.
  const isConfigured = !!config?.sheetName;

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
        ? [theme.colors[1], theme.colors[2], theme.colors[0]] // ABC segments
        : theme.bar, // solid single-series color
      borderRadius: 4,
      barPercentage: 0.7
    }]
  };

  const realDataLine = {
    labels,
    datasets: [{
      label: config?.yAxis || 'Value',
      data: dataValues,
      borderColor: theme.primary,
      backgroundColor: theme.primary,
      borderWidth: 2,
      tension: 0.4
    }]
  };

  const realDataPie = {
    labels,
    datasets: [{
      data: dataValues,
      backgroundColor: theme.colors,
      borderWidth: 1
    }]
  };

  const radarColors = theme.colors.slice(0, 5).map((c) => ({ bg: withAlpha(c, 0.2), border: c }));

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

      // Template placeholder: show its illustrative value until real data is bound.
      if (!isConfigured && config?.value) {
        kpiTitle = config.title || kpiTitle;
        kpiValue = config.value;
      }

      if (isConfigured) {
        kpiTitle = config.title;
        const total = dataValues.reduce((sum, val) => sum + val, 0);
        kpiValue = total >= 1000000
          ? (total/1000000).toFixed(1) + 'M'
          : total >= 1000
          ? (total/1000).toFixed(1) + 'k'
          : total?.toLocaleString(undefined, {maximumFractionDigits: 1});
        if (config.currency === '$') kpiValue = '$' + kpiValue;
        else if (config.currency === '€') kpiValue = '€' + kpiValue;
      }

      return (
        <div className="flex flex-col w-full h-full bg-white p-3 sm:p-5 cursor-pointer justify-center items-center shadow-[0px_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 rounded-2xl overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <AutoFitText
            text={kpiValue}
            className="font-bold tracking-tight w-full text-center whitespace-nowrap block"
            color={theme.kpi}
          />
          <span className="text-xs md:text-[13px] font-semibold text-[#5a7684] mt-1.5 md:mt-2.5 w-full text-center line-clamp-2" title={kpiTitle}>
            {kpiTitle}
          </span>
        </div>
      );
    }
    case 'table': {
      const cfg = widget?.config;
      if (cfg?.tableMode === 'tree' && cfg.tableTree) {
        // Older configs stored one tableMeasure + tree.totalSum; treat them as one-item lists.
        const measures = cfg.tableMeasures || (cfg.tableMeasure ? [cfg.tableMeasure] : []);
        const totalSums = cfg.tableTree.totalSums
          || (cfg.tableTree.totalSum != null ? [cfg.tableTree.totalSum] : null);
        return (
          <TreeTable
            tree={cfg.tableTree.tree}
            totalCount={cfg.tableTree.totalCount}
            totalSums={totalSums}
            level1Shown={cfg.tableTree.level1Shown ?? cfg.tableTree.tree.length}
            level1Total={cfg.tableTree.level1Total ?? cfg.tableTree.tree.length}
            deepTruncated={!!cfg.tableTree.deepTruncated}
            measureLabels={measures.map((m) => `Sum of ${m}`)}
          />
        );
      }
      const isTableConfigured = !!widget?.config?.tableData;
      const tableData = widget?.config?.tableData || [];
      const cols = widget?.config?.selectedColumns || [];

      if (isTableConfigured) {
        return <FlatTable cols={cols} rows={tableData} />;
      }

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
    case 'bubble': {
      // Bubble colors were baked into the config when it was built — re-tint at render time.
      const bubbleData = isConfigured && config.bubbleData
        ? { datasets: config.bubbleData.datasets.map((ds) => ({ ...ds, backgroundColor: withAlpha(theme.primary, 0.6), borderColor: theme.primary })) }
        : dummyDataBubble;
      return <Bubble data={bubbleData} options={getBubbleOptions(isConfigured)} />;
    }
    case 'speedometer': {
      const speedoValue = isConfigured ? (dataValues[0] || 0) : 75;
      let speedoFormat = speedoValue >= 1000000
          ? (speedoValue/1000000).toFixed(1) + 'M'
          : speedoValue >= 1000
          ? (speedoValue/1000).toFixed(1) + 'k'
          : speedoValue?.toLocaleString(undefined, {maximumFractionDigits: 1});
      if (config?.currency === '$') speedoFormat = '$' + speedoFormat;
      else if (config?.currency === '€') speedoFormat = '€' + speedoFormat;

      const speedoTitle = config?.title || 'Score';
      const gaugeMax = speedoValue > 100 ? speedoValue : 100;
      const visualFill = speedoValue > 100 ? 100 : speedoValue;

      const activeDataGauge = {
        labels: ['Score', 'Remaining'],
        datasets: [{ data: [visualFill, 100 - visualFill], backgroundColor: [theme.accent, '#f1f5f9'], borderWidth: 0 }]
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
      const funnelColors = theme.colors.slice(0, 5);

      return (
        <div className="flex flex-col items-center w-full h-full justify-center space-y-1.5 p-4 overflow-y-auto">
          {funnelData.slice(0, 7).map((d, i) => {
            const pct = maxVal > 0 ? (d.value / maxVal) * 90 : 10;
            return (
              <div key={i} style={{ width: `${Math.max(pct, 15)}%`, backgroundColor: funnelColors[i % funnelColors.length] }} className="h-8 rounded flex items-center justify-between px-3 text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform shrink-0">
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

export default function ChartWidget({ widget, onConfigure, onRemove, onDuplicate, isReadonly = false, themeKey }) {
  const isConfigured = !!widget.config;
  const theme = getTheme(themeKey);

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative group ${widget.type === 'kpi' && !isReadonly ? 'cursor-move grid-stack-drag-handle' : ''}`}>

      {/* Configuration Tools (Absolute for KPIs, in Header for others) */}
      {widget.type === 'kpi' && !isReadonly && (
        <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button onClick={(e) => { e.stopPropagation(); onConfigure(widget.id); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded bg-white shadow-sm border border-gray-100" title="Configure Data">
            <i className="fa-solid fa-gear text-xs"></i>
          </button>
          {onDuplicate && (
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(widget.id); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded bg-white shadow-sm border border-gray-100" title="Duplicate Widget">
              <i className="fa-solid fa-clone text-xs"></i>
            </button>
          )}
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
                className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                title="Configure Data"
              >
                <i className="fa-solid fa-gear text-xs"></i>
              </button>
              {onDuplicate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(widget.id); }}
                  className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                  title="Duplicate Widget"
                >
                  <i className="fa-solid fa-clone text-xs"></i>
                </button>
              )}
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
                {renderPreview(widget.type, widget, theme)}
             </div>

            {/* Overlay button on hover (Only in Builder) */}
            {!isReadonly && (
              <div className="absolute inset-0 bg-white/30 flex items-center justify-center opacity-0 group-hover/body:opacity-100 transition-opacity backdrop-blur-[1px]">
                <button
                  onClick={() => onConfigure(widget.id)}
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:bg-brand-700 transition transform hover:scale-105 flex items-center"
                >
                  <i className="fa-solid fa-database mr-2"></i>
                  Connect Data
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full">
             {renderPreview(widget.type, widget, theme)}
          </div>
        )}
      </div>

    </div>
  );
}
