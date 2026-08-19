export const RAW_DATA_KEY = 'dia_raw_data';

const SINGLE_VALUE_TYPES = ['kpi', 'speedometer'];
const MULTI_MEASURE_TYPES = ['radar', 'bubble'];
const CHART_ITEM_CAP = 50;
const TABLE_ROW_CAP = 500;

const toNumber = (value) => {
  const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const pickStat = (aggregation, stats) => {
  switch (aggregation) {
    case 'average': return stats.count > 0 ? stats.sum / stats.count : 0;
    case 'count': return stats.count;
    case 'min': return stats.min;
    case 'max': return stats.max;
    default: return stats.sum;
  }
};

function columnIndex(sheet, column) {
  const idx = sheet.headers.indexOf(column);
  if (idx === -1) throw new Error(`Column "${column}" was not found in sheet "${sheet.sheetName}".`);
  return idx;
}

function buildTable(sheet, selectedColumns) {
  const indices = selectedColumns.map((col) => columnIndex(sheet, col));
  return sheet.data.slice(0, TABLE_ROW_CAP).map((row) => {
    const obj = {};
    selectedColumns.forEach((col, i) => { obj[col] = row[indices[i]]; });
    return obj;
  });
}

function buildMultiMeasure(sheet, { xAxis, selectedColumns, aggregation, isBubble }) {
  const xIndex = columnIndex(sheet, xAxis);
  const yIndices = selectedColumns.map((col) => columnIndex(sheet, col));
  const groups = new Map();

  sheet.data.forEach((row) => {
    const key = row[xIndex] ?? 'Unknown';
    if (!groups.has(key)) {
      groups.set(key, { count: 0, stats: yIndices.map(() => ({ sum: 0, count: 0, min: Infinity, max: -Infinity })) });
    }
    const group = groups.get(key);
    group.count += 1;
    yIndices.forEach((yIdx, i) => {
      const value = toNumber(row[yIdx]);
      const s = group.stats[i];
      s.sum += value; s.count += 1;
      s.min = Math.min(s.min, value); s.max = Math.max(s.max, value);
    });
  });

  const ranked = [];
  groups.forEach((group, key) => {
    const measures = {};
    let totalScore = 0;
    selectedColumns.forEach((col, i) => {
      const value = pickStat(aggregation, group.stats[i]);
      measures[col] = value;
      totalScore += value;
    });
    ranked.push({ label: String(key), measures, totalScore });
  });
  ranked.sort((a, b) => b.totalScore - a.totalScore);

  // Radar polygons become unreadable past three overlapping entities.
  const radarData = {
    labels: selectedColumns,
    datasets: ranked.slice(0, 3).map((g) => ({ label: g.label, data: selectedColumns.map((c) => g.measures[c]) }))
  };

  let bubbleData = null;
  if (isBubble) {
    const points = ranked.map((g) => ({
      x: g.measures[selectedColumns[0]] || 0,
      y: g.measures[selectedColumns[1]] || 0,
      rRaw: g.measures[selectedColumns[2]] || 0,
      label: g.label
    }));
    const maxR = Math.max(0, ...points.map((p) => p.rRaw));
    bubbleData = {
      datasets: [{
        label: xAxis,
        data: points.map((p) => ({ x: p.x, y: p.y, r: maxR > 0 ? Math.max((p.rRaw / maxR) * 25, 4) : 10, label: p.label })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6'
      }]
    };
  }

  return { radarData, bubbleData };
}

function buildSingleValue(sheet, { yAxis, aggregation }) {
  const yIndex = columnIndex(sheet, yAxis);
  const stats = { sum: 0, count: 0, min: Infinity, max: -Infinity };
  sheet.data.forEach((row) => {
    const value = toNumber(row[yIndex]);
    stats.sum += value; stats.count += 1;
    stats.min = Math.min(stats.min, value); stats.max = Math.max(stats.max, value);
  });
  if (stats.min === Infinity) { stats.min = 0; stats.max = 0; }
  return [{ label: 'Total', value: pickStat(aggregation, stats) }];
}

// ABC / Pareto: how many rows make up the top 80 %, next 15 %, and tail 5 % of the total.
function buildSegmentation(sheet, { yAxis }) {
  const yIndex = columnIndex(sheet, yAxis);
  const values = [];
  let total = 0;
  sheet.data.forEach((row) => {
    const value = toNumber(row[yIndex]);
    if (value > 0) { values.push(value); total += value; }
  });
  values.sort((a, b) => b - a);

  let a = 0, b = 0, c = 0, running = 0;
  values.forEach((value) => {
    running += value;
    const ratio = running / total;
    if (ratio <= 0.8) a++; else if (ratio <= 0.95) b++; else c++;
  });
  return [
    { label: 'Top 80%', value: a },
    { label: '80-95%', value: b },
    { label: 'Tail 95%+', value: c }
  ];
}

function buildGrouped(sheet, { xAxis, yAxis, aggregation, dataLimit, sortByLabel }) {
  const xIndex = columnIndex(sheet, xAxis);
  const yIndex = columnIndex(sheet, yAxis);
  const groups = new Map();

  sheet.data.forEach((row) => {
    const key = row[xIndex] ?? 'Unknown';
    const value = toNumber(row[yIndex]);
    if (!groups.has(key)) groups.set(key, { sum: 0, count: 0, min: value, max: value });
    const g = groups.get(key);
    g.sum += value; g.count += 1;
    g.min = Math.min(g.min, value); g.max = Math.max(g.max, value);
  });

  const aggregated = [];
  let positiveTotal = 0;
  groups.forEach((stats, key) => {
    const value = pickStat(aggregation, stats);
    if (value > 0) positiveTotal += value;
    aggregated.push({ label: String(key), value });
  });

  if (sortByLabel) aggregated.sort((a, b) => a.label.localeCompare(b.label));
  else aggregated.sort((a, b) => b.value - a.value);

  if (dataLimit === 'top_20') return aggregated.slice(0, 20);

  if (dataLimit === 'top_80_percent' || dataLimit === 'top_90_percent') {
    const target = dataLimit === 'top_80_percent' ? 0.8 : 0.9;
    let running = 0;
    let cutoff = 0;
    for (let i = 0; i < aggregated.length; i++) {
      if (aggregated[i].value > 0) running += aggregated[i].value;
      cutoff = i;
      if (running / positiveTotal >= target) break;
    }
    return aggregated.slice(0, Math.min(cutoff + 1, CHART_ITEM_CAP));
  }

  return aggregated.slice(0, CHART_ITEM_CAP);
}

/**
 * Computes a widget's config (labels/values/etc.) from the user's selections and the raw sheets
 * held in the browser. Pure: no storage or network access. Throws with a user-facing message.
 *
 * form: { sheetName, xAxis, yAxis, aggregation, dataLimit, selectedColumns, customTitle }
 */
export function buildWidgetConfig(widgetType, form, rawSheets) {
  const sheet = rawSheets?.find((s) => s.sheetName === form.sheetName);
  if (!sheet || !sheet.data) throw new Error(`Sheet "${form.sheetName}" was not found in the loaded data.`);

  const isSingleValue = SINGLE_VALUE_TYPES.includes(widgetType);
  const isMultiMeasure = MULTI_MEASURE_TYPES.includes(widgetType);
  const isTable = widgetType === 'table';
  const isLine = widgetType === 'line';
  const isFunnel = widgetType === 'funnel';
  const aggregation = form.aggregation || 'sum';
  const isSegmentation = !isSingleValue && !isTable && !isMultiMeasure && aggregation === 'segmentation';
  const selectedColumns = form.selectedColumns || [];
  const customTitle = (form.customTitle || '').trim();
  // Line charts show every point in order; the limit control is not offered for them.
  const dataLimit = isSingleValue || isLine ? 'all' : (form.dataLimit || 'top_20');

  let aggregated = [];
  let tableData = null;
  let radarData = null;
  let bubbleData = null;

  if (isTable) {
    tableData = buildTable(sheet, selectedColumns);
  } else if (isMultiMeasure) {
    ({ radarData, bubbleData } = buildMultiMeasure(sheet, {
      xAxis: form.xAxis, selectedColumns, aggregation, isBubble: widgetType === 'bubble'
    }));
  } else if (isSingleValue) {
    aggregated = buildSingleValue(sheet, { yAxis: form.yAxis, aggregation });
  } else if (isSegmentation) {
    aggregated = buildSegmentation(sheet, { yAxis: form.yAxis });
  } else {
    aggregated = buildGrouped(sheet, {
      xAxis: form.xAxis, yAxis: form.yAxis, aggregation, dataLimit, sortByLabel: isLine
    });
  }

  const defaultTitle = isTable || isMultiMeasure
    ? `Data from ${form.sheetName}`
    : `${aggregation.toUpperCase()} of ${form.yAxis}${isSingleValue || isSegmentation ? '' : ` by ${form.xAxis}`}`;

  return {
    sheetName: form.sheetName,
    xAxis: isSingleValue || isTable || isSegmentation ? null : form.xAxis,
    yAxis: isTable || isMultiMeasure ? null : form.yAxis,
    aggregation: isTable ? null : aggregation,
    dataLimit,
    dataValues: isMultiMeasure || isTable ? null : aggregated.map((d) => d.value),
    labels: isMultiMeasure || isTable ? null : aggregated.map((d) => d.label),
    radarData: widgetType === 'radar' ? radarData : null,
    bubbleData: widgetType === 'bubble' ? bubbleData : null,
    aggregatedData: isFunnel ? aggregated : null,
    tableData: isTable ? tableData : null,
    selectedColumns: isTable || isMultiMeasure ? selectedColumns : null,
    customTitle,
    title: customTitle || defaultTitle
  };
}

/**
 * Re-runs every configured widget against freshly uploaded sheets.
 * Widgets whose sheet or columns no longer exist keep their previous values and are reported.
 */
export function refreshWidgetConfigs(widgets, rawSheets) {
  let refreshed = 0;
  const skipped = [];

  const next = widgets.map((widget) => {
    const config = widget.config;
    if (!config || !config.sheetName) return widget;
    try {
      const rebuilt = buildWidgetConfig(widget.type, {
        sheetName: config.sheetName,
        xAxis: config.xAxis,
        yAxis: config.yAxis,
        aggregation: config.aggregation,
        dataLimit: config.dataLimit,
        selectedColumns: config.selectedColumns,
        customTitle: config.customTitle
      }, rawSheets);
      refreshed++;
      return { ...widget, config: rebuilt };
    } catch (err) {
      skipped.push({ id: widget.id, title: config.title, reason: err.message });
      return widget;
    }
  });

  return { widgets: next, refreshed, skipped };
}
