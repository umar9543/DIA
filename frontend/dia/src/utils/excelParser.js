import * as XLSX from 'xlsx';

const HEADER_SCAN_LIMIT = 50;
const TEXT_EXTENSIONS = ['.csv', '.tsv', '.txt'];

const isBlank = (cell) => cell === undefined || cell === null || String(cell).trim() === '';

// Scores each of the first N rows and picks the one that looks most like a header:
// text cells count 10x more than any non-empty cell, so a title row loses to the real header.
function detectHeaderRow(rows) {
  let bestIndex = -1;
  let bestScore = -1;
  let headers = null;

  const limit = Math.min(rows.length, HEADER_SCAN_LIMIT);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let nonEmpty = 0;
    let strings = 0;
    for (const cell of row) {
      if (isBlank(cell)) continue;
      nonEmpty++;
      if (!(cell instanceof Date) && isNaN(Number(String(cell).trim()))) strings++;
    }

    const score = strings * 10 + nonEmpty;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
      headers = Array.from(row, (cell, idx) => (isBlank(cell) ? `Column_${idx + 1}` : String(cell).trim()));
    }
  }

  return { headerRowIndex: bestIndex, headers };
}

const pad = (n) => String(n).padStart(2, '0');

// Dates become sortable ISO strings so grouping/sorting works without exposing Excel serials.
function normalizeCell(cell) {
  if (cell instanceof Date) {
    if (isNaN(cell.getTime())) return null;
    const date = `${cell.getFullYear()}-${pad(cell.getMonth() + 1)}-${pad(cell.getDate())}`;
    const hasTime = cell.getHours() || cell.getMinutes() || cell.getSeconds();
    return hasTime ? `${date} ${pad(cell.getHours())}:${pad(cell.getMinutes())}` : date;
  }
  return cell;
}

async function readWorkbook(file) {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      text = new TextDecoder('windows-1252').decode(buffer);
    }
    // raw:true keeps CSV cells as typed text so "01.10.2024" or "1.234,56" are never reinterpreted.
    return XLSX.read(text, { type: 'string', raw: true, cellDates: true });
  }

  return XLSX.read(buffer, { type: 'array', cellDates: true });
}

/**
 * Parses a spreadsheet file entirely in the browser.
 * Returns [{ sheetName, headers, data }] where data rows follow the detected header row.
 * Nothing here touches the network.
 */
export async function parseWorkbookFile(file) {
  const workbook = await readWorkbook(file);
  const sheets = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const { headerRowIndex, headers } = detectHeaderRow(rows);
    if (!headers || headers.length === 0) continue;

    const data = rows
      .slice(headerRowIndex + 1)
      .map((row) => (Array.isArray(row) ? Array.from(row, normalizeCell) : []));

    sheets.push({ sheetName, headers, data });
  }

  if (sheets.length === 0) {
    throw new Error('The file is empty or has no header row.');
  }

  return sheets;
}

/** Strips row data so only metadata leaves the browser. */
export function toSchemaPayload(sheets) {
  return { sheets: sheets.map(({ sheetName, headers }) => ({ sheetName, headers })) };
}
