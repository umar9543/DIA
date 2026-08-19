const { getPool, sql } = require('../db');

const MAX_SHEETS = 100;
const MAX_COLUMNS = 500;
const MAX_NAME_LENGTH = 255;

// Accepts only sheet names and column headers. Row data is never sent to this API;
// the browser parses the workbook and keeps rows in IndexedDB.
function validateSheets(sheets) {
  if (!Array.isArray(sheets) || sheets.length === 0) return 'sheets must be a non-empty array';
  if (sheets.length > MAX_SHEETS) return `Too many sheets (max ${MAX_SHEETS})`;

  for (const sheet of sheets) {
    if (!sheet || typeof sheet.sheetName !== 'string' || sheet.sheetName.trim() === '') return 'Each sheet needs a sheetName';
    if (sheet.sheetName.length > MAX_NAME_LENGTH) return `Sheet name too long (max ${MAX_NAME_LENGTH})`;
    if (!Array.isArray(sheet.headers) || sheet.headers.length === 0) return `Sheet "${sheet.sheetName}" has no headers`;
    if (sheet.headers.length > MAX_COLUMNS) return `Sheet "${sheet.sheetName}" has too many columns (max ${MAX_COLUMNS})`;
    if (!sheet.headers.every(h => typeof h === 'string' && h.length <= MAX_NAME_LENGTH)) return `Sheet "${sheet.sheetName}" has invalid headers`;
  }
  return null;
}

exports.saveSchema = async (req, res) => {
  const { sheets } = req.body || {};
  const validationError = validateSheets(sheets);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const pool = getPool();
    const userId = req.user.id;

    for (const { sheetName, headers } of sheets) {
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('sheet_name', sql.NVarChar, sheetName)
        .input('columns_json', sql.NVarChar, JSON.stringify(headers))
        .query(`
          MERGE schemas AS target
          USING (SELECT @user_id AS user_id, @sheet_name AS sheet_name) AS source
            ON target.user_id = source.user_id AND target.sheet_name = source.sheet_name
          WHEN MATCHED THEN
            UPDATE SET columns_json = @columns_json, created_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (user_id, sheet_name, columns_json) VALUES (@user_id, @sheet_name, @columns_json);
        `);
    }

    res.status(200).json({
      message: 'Column metadata saved. No row data was received or stored.',
      saved: sheets.length
    });
  } catch (error) {
    console.error('Schema save error:', error);
    res.status(500).json({ error: 'Error saving column metadata' });
  }
};

exports.deleteSchemas = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM schemas WHERE user_id = @user_id');

    res.status(200).json({ deleted: result.rowsAffected[0] || 0 });
  } catch (error) {
    console.error('Schema delete error:', error);
    res.status(500).json({ error: 'Error deleting column metadata' });
  }
};
