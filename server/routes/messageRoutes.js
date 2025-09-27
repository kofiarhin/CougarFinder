const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMessages, listConversations } = require('../controllers/messageController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', listConversations);
router.get('/thread', getMessages);

module.exports = router;
