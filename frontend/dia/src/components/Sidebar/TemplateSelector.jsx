export const dashboardTemplates = [
  {
    id: 'sales-overview',
    title: 'Sales Overview',
    description: 'Executive Sales Overview',
    icon: 'fa-chart-pie',
    color: 'indigo',
    layout: [
      { id: 't1-1', type: 'kpi', x: 0, y: 0, w: 3, h: 2, config: { title: 'Total Revenue', value: '$1.4M', subtitle: '+14%' } },
      { id: 't1-2', type: 'kpi', x: 3, y: 0, w: 3, h: 2, config: { title: 'Win Rate', value: '32%', subtitle: '+2.1%' } },
      { id: 't1-3', type: 'kpi', x: 6, y: 0, w: 3, h: 2, config: { title: 'New Customers', value: '142', subtitle: '+18%' } },
      { id: 't1-4', type: 'speedometer', x: 9, y: 0, w: 3, h: 2, config: { title: 'Target Hit' } },
      { id: 't1-5', type: 'funnel', x: 0, y: 2, w: 5, h: 4, config: { title: 'Sales Funnel' } },
      { id: 't1-6', type: 'line', x: 5, y: 2, w: 7, h: 4, config: { title: 'Revenue Trend' } },
      { id: 't1-7', type: 'table', x: 0, y: 6, w: 12, h: 4, config: { title: 'Recent Won Deals' } },
    ]
  },
  {
    id: 'financial-perf',
    title: 'Financial Performance',
    description: 'Executive Financial KPIs',
    icon: 'fa-money-bill-trend-up',
    color: 'emerald',
    layout: [
      { id: 't2-1', type: 'kpi', x: 0, y: 0, w: 4, h: 2, config: { title: 'Net Profit', value: '$420K', subtitle: '+8%' } },
      { id: 't2-2', type: 'kpi', x: 4, y: 0, w: 4, h: 2, config: { title: 'Operating Costs', value: '$180K', subtitle: '-2%' } },
      { id: 't2-3', type: 'speedometer', x: 8, y: 0, w: 4, h: 2, config: { title: 'Budget Utilization' } },
      { id: 't2-4', type: 'bar', x: 0, y: 2, w: 6, h: 4, config: { title: 'Revenue vs Expenses' } },
      { id: 't2-5', type: 'radar', x: 6, y: 2, w: 6, h: 4, config: { title: 'Department Spending' } },
      { id: 't2-6', type: 'line', x: 0, y: 6, w: 6, h: 4, config: { title: 'Profit Margin Trend' } },
      { id: 't2-7', type: 'table', x: 6, y: 6, w: 6, h: 4, config: { title: 'Recent Transactions' } },
    ]
  }
];

export default function TemplateSelector({ onApplyTemplate }) {
  return (
    <div className="flex flex-col h-full space-y-4 pt-2">
      <div className="text-center mb-2">
         <h3 className="text-sm font-bold text-slate-800">Pre-built Layouts</h3>
         <p className="text-xs text-slate-500 mt-1">Start instantly with a template</p>
      </div>
      
      {dashboardTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onApplyTemplate(template.layout)}
          className="w-full flex items-center p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group shadow-sm hover:shadow bg-white"
        >
          <div className={`w-12 h-12 rounded-xl bg-${template.color}-100 flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition-transform`}>
            <i className={`fa-solid ${template.icon} text-${template.color}-600 text-xl`}></i>
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{template.title}</h4>
            <p className="text-xs text-slate-500 font-medium truncate mt-1">{template.description}</p>
          </div>
        </button>
      ))}
      
      <div className="mt-8 pt-6 border-t border-slate-200 border-dashed text-center">
        <i className="fa-solid fa-wand-magic-sparkles text-2xl text-slate-300 mb-3 block"></i>
        <p className="text-xs font-semibold text-slate-400">More templates coming soon.</p>
      </div>
    </div>
  );
}
