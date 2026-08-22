export const LAYOUT_KEY = 'dia_saved_layout';

export function createPage(name) {
  return {
    id: `page-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name,
    widgets: []
  };
}

/**
 * Loads saved dashboard pages. Older saves stored a flat widget array;
 * those are migrated into a single page so nothing a user built is lost.
 * Returns null when nothing is saved.
 */
export function loadPages() {
  const saved = localStorage.getItem(LAYOUT_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return [{ ...createPage('Page 1'), widgets: parsed }];
    }
    if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      return parsed.pages;
    }
  } catch (err) {
    console.error('Could not read saved layout:', err);
  }
  return null;
}

export function savePages(pages) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify({ version: 2, pages }));
}
