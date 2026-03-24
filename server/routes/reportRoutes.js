const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { submitReport, listReports, updateReportStatus } = require('../controllers/reportController');

const router = express.Router();

router.post('/', authMiddleware, submitReport);
router.get('/', authMiddleware, listReports);
router.patch('/:id/status', authMiddleware, updateReportStatus);

module.exports = router;
