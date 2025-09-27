const { Message } = require('../models/Message');
const { buildConvoId } = require('../utils/conversation');

const getMessages = async (req, res, next) => {
  try {
    const { withUserId, limit = 50 } = req.query;
    if (!withUserId) {
      return res.status(400).json({ message: 'withUserId is required' });
    }
    const convoId = buildConvoId(req.user._id, withUserId);
    const messages = await Message.find({ convoId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

const listConversations = async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: req.user._id },
            { toUserId: req.user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$convoId',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  listConversations
};
