import chartJsSource from '../../node_modules/chart.js/dist/chart.umd.js?raw';
import datalabelsSource from '../../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js?raw';
import { getTheme } from './themes';
import lockupInline from '../assets/brand/dia-lockup-sm.png?inline';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LOGO_IMG = `<img src="${lockupInline}" alt="DIA — Data into Action" style="display:block;height:38px;width:auto"/>`;

// The in-page renderer. Deliberately written without template literals so it can
// live inside the outer template string unescaped. It receives DIA_DATA
// ({ pages, theme }) and rebuilds every widget as a live element: real Chart.js
// charts with tooltips, tables with all rows, search and expand/collapse.
const RUNTIME_JS = String.raw`
(function () {
  var DATA = window.DIA_DATA;
  var THEME = DATA.theme;
  var CELL_H = 100, GAP = 10;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(v) { return Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
  function fmt2(v) { return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function short(v) {
    if (typeof v !== 'number') return v;
    return v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : fmt(v);
  }
  function alpha(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  if (window.ChartDataLabels) Chart.register(window.ChartDataLabels);

  var LEGEND_BOTTOM = { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } };

  function makeChart(canvas, cfgFn) {
    var chart = new Chart(canvas.getContext('2d'), cfgFn());
    return chart;
  }

  function renderWidget(w, card) {
    var cfg = w.config;
    var type = w.type;

    if (type === 'kpi') {
      var total = (cfg.dataValues || []).reduce(function (a, b) { return a + b; }, 0);
      var value = short(total);
      if (cfg.currency === '$') value = '$' + value;
      else if (cfg.currency === '€') value = '€' + value;
      card.classList.add('kpi');
      card.innerHTML = '<div class="kpi-value" style="color:' + THEME.kpi + '">' + esc(value) + '</div>' +
        '<div class="kpi-label">' + esc(cfg.title) + '</div>';
      var vEl = card.querySelector('.kpi-value');
      var fit = function () {
        var maxW = card.clientWidth * 0.85, size = Math.min(44, card.clientHeight * 0.4);
        vEl.style.fontSize = size + 'px';
        while (size > 12 && vEl.scrollWidth > maxW) { size -= 2; vEl.style.fontSize = size + 'px'; }
      };
      fit(); window.addEventListener('resize', fit);
      return;
    }

    if (type === 'speedometer') {
      var sv = (cfg.dataValues && cfg.dataValues[0]) || 0;
      var fill = sv > 100 ? 100 : sv;
      var svTxt = short(sv);
      if (cfg.currency === '$') svTxt = '$' + svTxt;
      else if (cfg.currency === '€') svTxt = '€' + svTxt;
      card.innerHTML = '<div class="w-title">' + esc(cfg.title) + '</div>' +
        '<div class="gauge-wrap"><canvas></canvas><div class="gauge-txt"><b>' + esc(svTxt) + '</b><span>' + esc(cfg.title) + '</span></div></div>';
      makeChart(card.querySelector('canvas'), function () {
        return {
          type: 'doughnut',
          data: { labels: ['Score', 'Rest'], datasets: [{ data: [fill, 100 - fill], backgroundColor: [THEME.accent, '#f1f5f9'], borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, circumference: 180, rotation: -90, cutout: '75%', plugins: { legend: { display: false }, datalabels: { display: false }, tooltip: { enabled: false } } }
        };
      });
      return;
    }

    if (type === 'funnel') {
      var steps = cfg.aggregatedData || [];
      var maxV = Math.max.apply(null, steps.map(function (d) { return d.value; }).concat([1]));
      var host = el('div', 'funnel');
      steps.slice(0, 7).forEach(function (d, i) {
        var pct = Math.max((d.value / maxV) * 90, 15);
        var bar = el('div', 'funnel-bar');
        bar.style.width = pct + '%';
        bar.style.backgroundColor = THEME.colors[i % 5];
        bar.innerHTML = '<span>' + esc(d.label) + '</span><span>' + fmt(d.value) + '</span>';
        host.appendChild(bar);
      });
      card.innerHTML = '<div class="w-title">' + esc(cfg.title) + '</div>';
      card.appendChild(host);
      return;
    }

    if (type === 'table') {
      card.innerHTML = '<div class="w-title">' + esc(cfg.title) + '</div>';
      if (cfg.tableMode === 'tree' && cfg.tableTree) renderTreeTable(card, cfg);
      else renderFlatTable(card, cfg);
      return;
    }

    // Chart.js widget types
    card.innerHTML = '<div class="w-title">' + esc(cfg.title) + '</div><div class="chart-wrap"><canvas></canvas></div>';
    var canvas = card.querySelector('canvas');
    var labels = cfg.labels || [];
    var values = cfg.dataValues || [];

    if (type === 'bar') {
      var isSeg = cfg.aggregation === 'segmentation';
      makeChart(canvas, function () {
        return {
          type: 'bar',
          data: { labels: labels, datasets: [{ label: cfg.yAxis || 'Value', data: values, backgroundColor: isSeg ? [THEME.colors[1], THEME.colors[2], THEME.colors[0]] : THEME.bar, borderRadius: 4, barPercentage: 0.7 }] },
          options: {
            indexAxis: isSeg ? 'x' : 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              datalabels: { display: true, align: 'end', anchor: 'end', color: '#475569', font: { size: 11, weight: '600' }, formatter: short }
            },
            scales: {
              x: { display: isSeg, grid: { display: false }, border: { display: false }, ticks: isSeg ? { font: { size: 11 }, color: '#334155', autoSkip: false } : undefined },
              y: { display: !isSeg, grid: { display: false }, border: { display: false }, ticks: !isSeg ? { font: { size: 11 }, color: '#334155', autoSkip: false } : undefined }
            },
            layout: { padding: isSeg ? { top: 30 } : { right: 50 } }
          }
        };
      });
    } else if (type === 'line') {
      makeChart(canvas, function () {
        return {
          type: 'line',
          data: { labels: labels, datasets: [{ label: cfg.yAxis || 'Value', data: values, borderColor: THEME.primary, backgroundColor: THEME.primary, borderWidth: 2, tension: 0.4 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: LEGEND_BOTTOM, datalabels: { display: false } } }
        };
      });
    } else if (type === 'pie' || type === 'doughnut') {
      makeChart(canvas, function () {
        return {
          type: type,
          data: { labels: labels, datasets: [{ data: values, backgroundColor: THEME.colors, borderWidth: 1 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: LEGEND_BOTTOM, datalabels: { display: false } } }
        };
      });
    } else if (type === 'radar' && cfg.radarData) {
      makeChart(canvas, function () {
        return {
          type: 'radar',
          data: {
            labels: cfg.radarData.labels,
            datasets: cfg.radarData.datasets.map(function (ds, i) {
              var c = THEME.colors[i % 5];
              return { label: ds.label, data: ds.data, backgroundColor: alpha(c, 0.2), borderColor: c, borderWidth: 2 };
            })
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { r: { ticks: { display: false }, grid: { color: '#e2e8f0' }, pointLabels: { font: { size: 10 }, color: '#64748b' } } }, plugins: { legend: LEGEND_BOTTOM, datalabels: { display: false } } }
        };
      });
    } else if (type === 'bubble' && cfg.bubbleData) {
      makeChart(canvas, function () {
        return {
          type: 'bubble',
          data: { datasets: cfg.bubbleData.datasets.map(function (ds) { return Object.assign({}, ds, { backgroundColor: alpha(THEME.primary, 0.6), borderColor: THEME.primary }); }) },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: LEGEND_BOTTOM, datalabels: { display: false },
              tooltip: { callbacks: { label: function (c) { var p = c.raw; return (p.label || '') + ' (X: ' + fmt(p.x) + ', Y: ' + fmt(p.y) + ')'; } } }
            }
          }
        };
      });
    }
  }

  function searchBox(onInput) {
    var wrap = el('div', 'tsearch');
    wrap.innerHTML = '<input type="text" placeholder="Search rows…"><button title="Clear">×</button>';
    var input = wrap.querySelector('input');
    var clear = wrap.querySelector('button');
    input.addEventListener('input', function () { clear.style.display = input.value ? 'block' : 'none'; onInput(input.value); });
    clear.style.display = 'none';
    clear.addEventListener('click', function () { input.value = ''; clear.style.display = 'none'; onInput(''); });
    return wrap;
  }

  function renderFlatTable(card, cfg) {
    var cols = cfg.selectedColumns || [];
    var rows = cfg.tableData || [];
    var body = el('div', 'tbl-scroll');
    var render = function (q) {
      q = q.trim().toLowerCase();
      var visible = q ? rows.filter(function (r) { return cols.some(function (c) { return String(r[c] == null ? '' : r[c]).toLowerCase().indexOf(q) !== -1; }); }) : rows;
      var html = '<table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
      if (visible.length === 0) html += '<tr><td colspan="' + cols.length + '" class="empty">No rows match</td></tr>';
      visible.forEach(function (r) {
        html += '<tr>' + cols.map(function (c) {
          var v = r[c];
          var out = (v !== '' && v !== null && v !== undefined && !isNaN(v)) ? fmt2(v) : esc(v == null ? '' : v);
          return '<td title="' + esc(v == null ? '' : v) + '">' + out + '</td>';
        }).join('') + '</tr>';
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    };
    card.appendChild(searchBox(render));
    card.appendChild(body);
    render('');
  }

  function renderTreeTable(card, cfg) {
    var t = cfg.tableTree;
    var hasSum = t.totalSum !== null && t.totalSum !== undefined;
    var open = {};
    var query = '';
    var body = el('div', 'tbl-scroll');
    var foot = el('div', 'tbl-foot');

    function filterNodes(nodes, q) {
      var out = [];
      nodes.forEach(function (n) {
        var self = String(n.label).toLowerCase().indexOf(q) !== -1;
        var kids = filterNodes(n.children, q);
        if (self || kids.length) out.push({ label: n.label, count: n.count, sum: n.sum, children: self ? n.children : kids });
      });
      return out;
    }

    function render() {
      var q = query.trim().toLowerCase();
      var tree = q ? filterNodes(t.tree, q) : t.tree;
      var html = '<table><thead><tr><th>Group</th><th class="num">Rows</th>' + (hasSum ? '<th class="num">Sum of ' + esc(cfg.tableMeasure) + '</th>' : '') + '</tr></thead><tbody>';
      var walk = function (nodes, depth, path) {
        nodes.forEach(function (n) {
          var key = path + '::' + n.label;
          var isOpen = q ? true : !!open[key];
          var kids = n.children.length > 0;
          html += '<tr data-key="' + esc(key) + '" class="' + (kids ? 'grp' : '') + (depth === 0 ? ' top' : '') + '">' +
            '<td><span style="padding-left:' + depth * 18 + 'px" class="cell">' +
            (kids ? '<i class="chev' + (isOpen ? ' openc' : '') + '"></i>' : '<i class="chev-pad"></i>') +
            esc(n.label) + '</span></td>' +
            '<td class="num">' + fmt(n.count) + '</td>' +
            (hasSum ? '<td class="num">' + fmt(n.sum) + '</td>' : '') + '</tr>';
          if (isOpen && kids) walk(n.children, depth + 1, key);
        });
      };
      if (q && tree.length === 0) html += '<tr><td colspan="' + (hasSum ? 3 : 2) + '" class="empty">No groups match</td></tr>';
      walk(tree, 0, '');
      html += '</tbody></table>';
      body.innerHTML = html;
      body.querySelectorAll('tr.grp').forEach(function (tr) {
        tr.addEventListener('click', function () { var k = tr.getAttribute('data-key'); open[k] = !open[k]; render(); });
      });
      var sc = q ? tree.reduce(function (a, n) { return a + n.count; }, 0) : t.totalCount;
      var ss = q ? tree.reduce(function (a, n) { return a + (n.sum || 0); }, 0) : t.totalSum;
      foot.innerHTML = '<span>' + (q ? 'Total (filtered)' : 'Total') + '</span><span class="num">' + fmt(sc) + '</span>' + (hasSum ? '<span class="num">' + fmt(ss) + '</span>' : '');
    }
    card.appendChild(searchBox(function (q) { query = q; render(); }));
    card.appendChild(body);
    card.appendChild(foot);
    render();
  }

  // ---- page layout ----
  var main = document.querySelector('main');
  DATA.pages.forEach(function (page, pi) {
    var section = el('section', 'page' + (pi === 0 ? ' active' : ''));
    section.setAttribute('data-page', pi);
    section.innerHTML = '<div class="page-head"><h2>' + esc(page.name) + '</h2></div>';
    var board = el('div', 'board');
    var maxY = 0;
    var autoY = 0;
    page.widgets.forEach(function (w) {
      var x = w.x, y = w.y, ww = w.w || 4, wh = w.h || 3;
      if (x === undefined || x === null || y === undefined || y === null) { x = 0; y = autoY; autoY += wh; }
      maxY = Math.max(maxY, y + wh, autoY);
      var card = el('div', 'card' + (w.type === 'kpi' ? '' : ' pad'));
      card.style.left = 'calc(' + (x / 12) * 100 + '% + ' + GAP + 'px)';
      card.style.width = 'calc(' + (ww / 12) * 100 + '% - ' + GAP * 2 + 'px)';
      card.style.top = (y * CELL_H + GAP) + 'px';
      card.style.height = (wh * CELL_H - GAP * 2) + 'px';
      try { renderWidget(w, card); } catch (e) { card.innerHTML = '<div class="w-title">' + esc(w.config && w.config.title || w.type) + '</div><div class="empty">Could not render</div>'; }
      board.appendChild(card);
    });
    board.style.height = (maxY * CELL_H + GAP) + 'px';
    section.appendChild(board);
    main.appendChild(section);
  });

  // pages nav
  var navs = Array.prototype.slice.call(document.querySelectorAll('.nav'));
  navs.forEach(function (n) {
    n.addEventListener('click', function () {
      navs.forEach(function (x) { x.classList.toggle('active', x === n); });
      document.querySelectorAll('.page').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-page') === n.getAttribute('data-page')); });
      window.dispatchEvent(new Event('resize')); // charts resize into the newly shown page
    });
  });
})();
`;

/**
 * Builds a single self-contained INTERACTIVE HTML file: live Chart.js charts
 * with tooltips, tables with every stored row (scroll, search, expandable
 * hierarchy), page navigation and the dashboard's theme. Chart.js is embedded,
 * so the file works completely offline.
 *
 * pages: the saved dashboard pages (only configured widgets are exported)
 */
export function buildDashboardHtml(pages, { title = 'DIA Dashboard', themeKey } = {}) {
  const theme = getTheme(themeKey);
  const generated = new Date().toLocaleString();

  const exportPages = pages
    .map((p) => ({ name: p.name, widgets: p.widgets.filter((w) => w.config) }))
    .filter((p) => p.widgets.length > 0);

  const payload = JSON.stringify({ pages: exportPages, theme }).replace(/</g, '\\u003c');

  const nav = exportPages.map((p, i) => `
    <button class="nav${i === 0 ? ' active' : ''}" data-page="${i}">
      <span class="chip">${i + 1}</span>
      <span class="nav-label">${escapeHtml(p.name)}</span>
    </button>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; background: #f9fafb; color: #0f172a; display: flex; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  aside { width: 256px; flex-shrink: 0; background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
  .brand { display: flex; align-items: center; gap: 12px; padding: 24px 20px 20px; }
  .brand-name { color: #0f172a; font-weight: 800; font-size: 17px; letter-spacing: -0.02em; line-height: 1.1; }
  .brand-sub { color: #94a3b8; font-size: 11px; font-weight: 600; margin-top: 2px; }
  .section-label { padding: 4px 22px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; }
  nav { padding: 0 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; }
  .nav { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; cursor: pointer; background: none; color: #64748b; font: inherit; font-size: 14px; font-weight: 600; text-align: left; transition: all .15s ease; }
  .nav:hover { background: #f8fafc; color: #0f172a; }
  .nav.active { background: #eef2ff; color: #4338ca; }
  .chip { width: 24px; height: 24px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #94a3b8; }
  .nav.active .chip { background: #4f46e5; color: #fff; }
  .nav-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .side-foot { padding: 16px 20px 20px; border-top: 1px solid #f1f5f9; }
  .zdr { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #64748b; }
  .zdr-dot { width: 7px; height: 7px; border-radius: 999px; background: #10b981; }
  .side-foot p { font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5; }

  main { flex: 1; padding: 24px 28px 48px; min-width: 0; }
  .page { display: none; }
  .page.active { display: block; }
  .page-head h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 16px; }
  .board { position: relative; }
  .card { position: absolute; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px -4px rgba(15,23,42,.08), 0 1px 3px rgba(15,23,42,.04); overflow: hidden; display: flex; flex-direction: column; }
  .card.kpi { align-items: center; justify-content: center; padding: 12px; }
  .kpi-value { font-weight: 800; letter-spacing: -0.02em; white-space: nowrap; line-height: 1.05; }
  .kpi-label { font-size: 12px; font-weight: 600; color: #5a7684; margin-top: 8px; text-align: center; }
  .w-title { font-size: 13px; font-weight: 600; color: #475569; padding: 11px 16px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chart-wrap { flex: 1; min-height: 0; padding: 12px; position: relative; }
  .chart-wrap canvas { max-width: 100%; }
  .gauge-wrap { flex: 1; position: relative; padding: 10px; display: flex; align-items: center; justify-content: center; }
  .gauge-txt { position: absolute; bottom: 14%; left: 0; right: 0; text-align: center; pointer-events: none; }
  .gauge-txt b { display: block; font-size: 26px; color: #1f2937; }
  .gauge-txt span { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #9ca3af; letter-spacing: .08em; }
  .funnel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px; overflow-y: auto; }
  .funnel-bar { height: 30px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; flex-shrink: 0; }

  .tsearch { padding: 8px 8px 6px; flex-shrink: 0; position: relative; }
  .tsearch input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 26px 6px 10px; font: inherit; font-size: 12px; color: #334155; }
  .tsearch input:focus { outline: none; border-color: #818cf8; }
  .tsearch button { position: absolute; right: 16px; top: 50%; transform: translateY(-40%); border: 0; background: none; color: #94a3b8; font-size: 14px; cursor: pointer; }
  .tbl-scroll { flex: 1; overflow: auto; min-height: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; color: #6b7280; }
  thead th { position: sticky; top: 0; background: #f9fafb; text-align: left; font-size: 11px; text-transform: uppercase; color: #374151; padding: 9px 14px; white-space: nowrap; box-shadow: 0 1px 0 #e5e7eb; }
  th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td { padding: 8px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; font-weight: 500; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  tbody tr.grp { cursor: pointer; }
  tbody tr.grp:hover { background: #eef2ff66; }
  tbody tr.top { background: #f8fafc99; }
  tbody tr.top > td:first-child { font-weight: 600; color: #1f2937; }
  .cell { display: inline-flex; align-items: center; }
  .chev { width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 5px solid #6366f1; margin-right: 8px; transition: transform .15s; }
  .chev.openc { transform: rotate(90deg); }
  .chev-pad { width: 13px; display: inline-block; }
  td.empty { text-align: center; color: #94a3b8; font-size: 12px; padding: 20px; }
  .tbl-foot { display: grid; grid-template-columns: 1fr auto auto; gap: 24px; padding: 8px 14px; background: #f9fafb; border-top: 2px solid #e5e7eb; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #374151; flex-shrink: 0; }

  @media (max-width: 720px) { body { flex-direction: column; } aside { width: 100%; height: auto; position: static; } nav { flex-direction: row; flex-wrap: wrap; padding-bottom: 12px; } .nav { width: auto; } main { padding: 16px; } }
</style>
</head>
<body>
<aside>
  <div class="brand">
    ${LOGO_IMG}
  </div>
  <div class="section-label">Pages</div>
  <nav>
    ${nav}
  </nav>
  <div class="side-foot">
    <div class="zdr"><span class="zdr-dot"></span>Zero Data Retention</div>
    <p>Interactive export &mdash; works offline.<br>Generated by DIA on ${escapeHtml(generated)}.</p>
  </div>
</aside>
<main></main>
<script>${chartJsSource}</script>
<script>${datalabelsSource}</script>
<script>window.DIA_DATA = ${payload};</script>
<script>${RUNTIME_JS}</script>
</body>
</html>`;
}
