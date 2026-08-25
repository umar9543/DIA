// Chart color themes, Power-BI style: one selected theme recolors every widget.
// "vivid" reproduces the app's original colors and is the default.
// colors: series palette (pie/doughnut slices, radar entities, funnel steps, ABC segments)
// primary: single-series color (bars, lines)  ·  kpi: KPI number  ·  accent: gauge fill
export const CHART_THEMES = {
  vivid: {
    name: 'Vivid',
    colors: ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
    primary: '#6366f1',
    bar: '#334155',
    kpi: '#006085',
    accent: '#10b981'
  },
  indigo: {
    name: 'Indigo',
    colors: ['#4f46e5', '#818cf8', '#a78bfa', '#7c3aed', '#c4b5fd', '#6366f1', '#312e81', '#a5b4fc'],
    primary: '#4f46e5',
    bar: '#4f46e5',
    kpi: '#312e81',
    accent: '#6366f1'
  },
  ocean: {
    name: 'Ocean',
    colors: ['#0284c7', '#06b6d4', '#38bdf8', '#0e7490', '#67e8f9', '#0ea5e9', '#155e75', '#7dd3fc'],
    primary: '#0284c7',
    bar: '#0e7490',
    kpi: '#155e75',
    accent: '#06b6d4'
  },
  forest: {
    name: 'Forest',
    colors: ['#16a34a', '#4ade80', '#a3e635', '#15803d', '#86efac', '#65a30d', '#166534', '#bbf7d0'],
    primary: '#16a34a',
    bar: '#15803d',
    kpi: '#166534',
    accent: '#22c55e'
  },
  sunset: {
    name: 'Sunset',
    colors: ['#ea580c', '#f59e0b', '#ef4444', '#fb923c', '#fbbf24', '#dc2626', '#9a3412', '#fed7aa'],
    primary: '#ea580c',
    bar: '#c2410c',
    kpi: '#9a3412',
    accent: '#f97316'
  },
  berry: {
    name: 'Berry',
    colors: ['#db2777', '#a21caf', '#e879f9', '#f472b6', '#c026d3', '#9d174d', '#831843', '#f0abfc'],
    primary: '#db2777',
    bar: '#a21caf',
    kpi: '#831843',
    accent: '#ec4899'
  },
  slate: {
    name: 'Slate (IBCS)',
    colors: ['#334155', '#64748b', '#94a3b8', '#0f172a', '#cbd5e1', '#475569', '#1e293b', '#e2e8f0'],
    primary: '#334155',
    bar: '#334155',
    kpi: '#0f172a',
    accent: '#334155'
  }
};

export const DEFAULT_THEME_KEY = 'vivid';

export function getTheme(key) {
  return CHART_THEMES[key] || CHART_THEMES[DEFAULT_THEME_KEY];
}

/** hex -> rgba string with the given alpha (for radar/bubble fills) */
export function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
