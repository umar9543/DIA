const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemaController');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/schema
// @desc    Save sheet names + column headers (metadata only; no row data accepted)
// @access  Private
router.post('/', auth, schemaController.saveSchema);

// @route   DELETE /api/schema
// @desc    Delete all stored column metadata for the current user
// @access  Private
router.delete('/', auth, schemaController.deleteSchemas);

module.exports = router;
