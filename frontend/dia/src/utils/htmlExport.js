const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4H16C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28H6V4Z" fill="url(#dia-logo-g)"/><path d="M6 14H12C16.4183 14 20 17.5817 20 22C20 26.4183 16.4183 28 12 28H6V14Z" fill="white" fill-opacity="0.15"/><circle cx="15" cy="16" r="3.5" fill="white"/><defs><linearGradient id="dia-logo-g" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs></svg>`;

/**
 * Builds a single self-contained HTML file for the whole dashboard, styled to
 * match the app: dark branded sidebar, light canvas, widget cards with the same
 * rounded corners and soft shadows.
 * pages: [{ name, width, height, widgets: [{ img, x, y, w, h }] }]
 * Widget snapshots are embedded as data URIs, so the file needs no server or internet.
 */
export function buildDashboardHtml(pages, { title = 'DIA Dashboard' } = {}) {
  const generated = new Date().toLocaleString();

  const nav = pages.map((p, i) => `
    <button class="nav${i === 0 ? ' active' : ''}" data-page="${i}">
      <span class="chip">${i + 1}</span>
      <span class="nav-label">${escapeHtml(p.name)}</span>
    </button>`
  ).join('\n');

  const sections = pages.map((p, i) => `
    <section class="page${i === 0 ? ' active' : ''}" data-page="${i}">
      <div class="page-head">
        <h2>${escapeHtml(p.name)}</h2>
      </div>
      <div class="board-wrap">
        <div class="board" data-w="${p.width}" data-h="${p.height}" style="width:${p.width}px;height:${p.height}px">
          ${p.widgets.map(w =>
            `<img src="${w.img}" style="left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px" alt="">`
          ).join('\n')}
        </div>
      </div>
    </section>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    background: #f9fafb; color: #0f172a;
    display: flex; min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ---- Sidebar ---- */
  aside {
    width: 256px; flex-shrink: 0;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
  }
  .brand { display: flex; align-items: center; gap: 12px; padding: 24px 20px 20px; }
  .brand-name { color: #0f172a; font-weight: 800; font-size: 17px; letter-spacing: -0.02em; line-height: 1.1; }
  .brand-sub { color: #94a3b8; font-size: 11px; font-weight: 600; margin-top: 2px; }
  .section-label { padding: 4px 22px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; }
  nav { padding: 0 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; }
  .nav {
    display: flex; align-items: center; gap: 12px; width: 100%;
    padding: 10px 12px; border: 0; border-radius: 12px; cursor: pointer;
    background: none; color: #64748b; font: inherit; font-size: 14px; font-weight: 600; text-align: left;
    transition: all .15s ease;
  }
  .nav:hover { background: #f8fafc; color: #0f172a; }
  .nav.active { background: #eef2ff; color: #4338ca; }
  .chip {
    width: 24px; height: 24px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    background: #f1f5f9; color: #94a3b8;
    transition: all .15s ease;
  }
  .nav:hover .chip { background: #e2e8f0; color: #475569; }
  .nav.active .chip { background: #4f46e5; color: #fff; box-shadow: 0 1px 3px rgba(79,70,229,0.4); }
  .nav-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .side-foot { padding: 16px 20px 20px; border-top: 1px solid #f1f5f9; }
  .zdr { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #64748b; }
  .zdr-dot { width: 7px; height: 7px; border-radius: 999px; background: #10b981; }
  .side-foot p { font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5; }

  /* ---- Content ---- */
  main { flex: 1; padding: 28px 32px 48px; min-width: 0; }
  .page { display: none; }
  .page.active { display: block; }
  .page-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
  .page-head h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
  .board-wrap { position: relative; overflow: hidden; }
  .board { position: relative; transform-origin: 0 0; }
  .board img {
    position: absolute; display: block;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  @media (max-width: 720px) {
    body { flex-direction: column; }
    aside { width: 100%; height: auto; position: static; }
    nav { flex-direction: row; flex-wrap: wrap; padding-bottom: 12px; }
    .nav { width: auto; }
    main { padding: 20px; }
  }
</style>
</head>
<body>
<aside>
  <div class="brand">
    ${LOGO_SVG}
    <div>
      <div class="brand-name">DIA</div>
      <div class="brand-sub">Analytics Dashboard</div>
    </div>
  </div>
  <div class="section-label">Pages</div>
  <nav>
    ${nav}
  </nav>
  <div class="side-foot">
    <div class="zdr"><span class="zdr-dot"></span>Zero Data Retention</div>
    <p>Static snapshot — contains no raw row data.<br>Generated by DIA on ${escapeHtml(generated)}.</p>
  </div>
</aside>
<main>
  ${sections}
</main>
<script>
  var navs = Array.prototype.slice.call(document.querySelectorAll('.nav'));
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  function fit() {
    document.querySelectorAll('.page.active .board').forEach(function (b) {
      var w = +b.dataset.w, h = +b.dataset.h;
      var avail = b.closest('.board-wrap').clientWidth;
      var s = Math.min(1, avail / w);
      b.style.transform = 'scale(' + s + ')';
      b.closest('.board-wrap').style.height = (h * s) + 'px';
    });
  }
  navs.forEach(function (n) {
    n.addEventListener('click', function () {
      navs.forEach(function (x) { x.classList.toggle('active', x === n); });
      pages.forEach(function (p) { p.classList.toggle('active', p.dataset.page === n.dataset.page); });
      fit();
    });
  });
  window.addEventListener('resize', fit);
  fit();
</script>
</body>
</html>`;
}
