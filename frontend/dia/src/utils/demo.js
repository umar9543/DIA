// Demo mode runs the full builder flow without accounts or a backend:
// no login required, spreadsheet parsing and charts work entirely in the browser,
// and the column-metadata sync is skipped. Enable with VITE_DEMO_MODE=true.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
