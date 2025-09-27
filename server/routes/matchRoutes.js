const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { browseMatches } = require('../controllers/matchController');

const router = express.Router();

router.get('/', authMiddleware, browseMatches);

module.exports = router;
