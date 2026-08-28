export const RAW_DATA_KEY = 'dia_raw_data';

const SINGLE_VALUE_TYPES = ['kpi', 'speedometer'];
const MULTI_MEASURE_TYPES = ['radar', 'bubble'];
const CHART_ITEM_CAP = 50;
const TABLE_ROW_CAP = 500;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

// Month names (English and German, full and abbreviated) -> calendar index.
const MONTHS = {
  jan: 0, january: 0, januar: 0,
  feb: 1, february: 1, februar: 1,
  mar: 2, march: 2, 'mär': 2, mrz: 2, maerz: 2, 'märz': 2,
  apr: 3, april: 3,
  may: 4, mai: 4,
  jun: 5, june: 5, juni: 5,
  jul: 6, july: 6, juli: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, okt: 9, oktober: 9,
  nov: 10, november: 10,
  dec: 11, december: 11, dez: 11, dezember: 11
};
const monthIndexOf = (label) => {
  const key = String(label).trim().toLowerCase().replace(/\.$/, '');
  return key in MONTHS ? MONTHS[key] : -1;
};

const toNumber = (value) => {
  const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const pickStat = (aggregation, stats) => {
  switch (aggregation) {
    case 'average': return stats.count > 0 ? stats.sum / stats.count : 0;
    case 'count': return stats.count;
    case 'min': return stats.min === Infinity ? 0 : stats.min;
    case 'max': return stats.max === -Infinity ? 0 : stats.max;
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

// Pivot-style tree: rows grouped by each hierarchy column in turn, with a row
// count and (optionally) the sum of one or more value columns per group.
function buildTableTree(sheet, { hierarchy, measures }) {
  const levelIdxs = hierarchy.map((c) => columnIndex(sheet, c));
  const measureIdxs = (measures || []).map((c) => columnIndex(sheet, c));
  const hasMeasures = measureIdxs.length > 0;
  // The first level often holds a near-unique key (order no., requisition no.) with
  // thousands of groups — searching only works on groups that are actually in the
  // tree, so keep the caps generous and report when they truncate.
  const LEVEL1_MAX = 5000;
  const DEEP_MAX = 200;      // per parent, ranked by value
  const TOTAL_BUDGET = 20000; // hard ceiling on stored nodes across the whole tree

  const newSums = () => measureIdxs.map(() => 0);
  const addRow = (node, row) => {
    node.count += 1;
    measureIdxs.forEach((mIdx, i) => {
      node.sums[i] += toNumber(isBlank(row[mIdx]) ? 0 : row[mIdx]);
    });
  };

  const root = { children: new Map(), count: 0, sums: newSums() };
  sheet.data.forEach((row) => {
    addRow(root, row);
    let node = root;
    for (const idx of levelIdxs) {
      const key = isBlank(row[idx]) ? 'Unknown' : String(row[idx]).trim();
      if (!node.children.has(key)) node.children.set(key, { children: new Map(), count: 0, sums: newSums() });
      node = node.children.get(key);
      addRow(node, row);
    }
  });

  const budget = { used: 0, deepTruncated: false };
  const toArray = (map, depth) => {
    const cap = depth === 0 ? LEVEL1_MAX : DEEP_MAX;
    const entries = [...map.entries()]
      .map(([label, n]) => ({ label, node: n }))
      .sort((a, b) => (hasMeasures ? b.node.sums[0] - a.node.sums[0] : b.node.count - a.node.count));
    if (entries.length > cap && depth > 0) budget.deepTruncated = true;
    const out = [];
    for (const { label, node } of entries.slice(0, cap)) {
      if (budget.used >= TOTAL_BUDGET) { budget.deepTruncated = true; break; }
      budget.used += 1;
      out.push({
        label,
        count: node.count,
        sums: hasMeasures ? node.sums : null,
        children: toArray(node.children, depth + 1)
      });
    }
    return out;
  };

  const level1Total = root.children.size;
  const tree = toArray(root.children, 0);

  return {
    tree,
    totalCount: root.count,
    totalSums: hasMeasures ? root.sums : null,
    level1Total,
    level1Shown: tree.length,
    deepTruncated: budget.deepTruncated
  };
}

function buildMultiMeasure(sheet, { xAxis, selectedColumns, aggregation, isBubble }) {
  const xIndex = columnIndex(sheet, xAxis);
  const yIndices = selectedColumns.map((col) => columnIndex(sheet, col));
  const groups = new Map();

  sheet.data.forEach((row) => {
    if (yIndices.every((yIdx) => isBlank(row[yIdx]))) return; // nothing measurable in this row
    const key = isBlank(row[xIndex]) ? 'Unknown' : row[xIndex];
    if (!groups.has(key)) {
      groups.set(key, { count: 0, stats: yIndices.map(() => ({ sum: 0, count: 0, min: Infinity, max: -Infinity })) });
    }
    const group = groups.get(key);
    group.count += 1;
    yIndices.forEach((yIdx, i) => {
      if (isBlank(row[yIdx])) return; // empty cells do not count
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

  // Distinct: how many different values the column holds (repeated suppliers count once).
  if (aggregation === 'distinct') {
    const seen = new Set();
    sheet.data.forEach((row) => {
      if (!isBlank(row[yIndex])) seen.add(String(row[yIndex]).trim());
    });
    return [{ label: 'Total', value: seen.size }];
  }

  const stats = { sum: 0, count: 0, min: Infinity, max: -Infinity };
  sheet.data.forEach((row) => {
    if (isBlank(row[yIndex])) return; // empty cells do not count
    const value = toNumber(row[yIndex]);
    stats.sum += value; stats.count += 1;
    stats.min = Math.min(stats.min, value); stats.max = Math.max(stats.max, value);
  });
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
    if (isBlank(row[yIndex])) return; // empty cells do not count
    const key = isBlank(row[xIndex]) ? 'Unknown' : row[xIndex];
    const value = toNumber(row[yIndex]);
    if (!groups.has(key)) groups.set(key, { sum: 0, count: 0, min: Infinity, max: -Infinity });
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

  // A month column sorts by calendar order, never alphabetically or by value.
  const isMonthSeries = aggregated.length > 1 && aggregated.every((d) => monthIndexOf(d.label) !== -1);
  if (isMonthSeries) aggregated.sort((a, b) => monthIndexOf(a.label) - monthIndexOf(b.label));
  else if (sortByLabel) aggregated.sort((a, b) => a.label.localeCompare(b.label));
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
  let tableTree = null;
  let radarData = null;
  let bubbleData = null;

  // Older widgets stored a single tableMeasure string; treat it as a one-item list.
  const tableMeasures = (form.tableMeasures && form.tableMeasures.length > 0)
    ? form.tableMeasures
    : (form.tableMeasure ? [form.tableMeasure] : []);

  if (isTable) {
    if (form.tableMode === 'tree') {
      tableTree = buildTableTree(sheet, { hierarchy: selectedColumns, measures: tableMeasures });
    } else {
      tableData = buildTable(sheet, selectedColumns);
    }
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

  const defaultTitle = isTable && form.tableMode === 'tree'
    ? selectedColumns.join(' › ')
    : isTable || isMultiMeasure
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
    tableTree: isTable ? tableTree : null,
    tableMode: isTable ? (form.tableMode || 'flat') : null,
    tableMeasures: isTable ? tableMeasures : null,
    selectedColumns: isTable || isMultiMeasure ? selectedColumns : null,
    currency: isSingleValue ? (form.currency || '') : null,
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
        tableMode: config.tableMode,
        tableMeasures: config.tableMeasures,
        tableMeasure: config.tableMeasure,
        currency: config.currency,
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
