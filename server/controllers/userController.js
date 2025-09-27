const { User } = require('../models/User');
const { Like } = require('../models/Like');

const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    Object.assign(req.user, updates);
    await req.user.save();
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

const sendLike = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }
    const like = await Like.findOneAndUpdate(
      { fromUserId: req.user._id, toUserId: targetUserId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ like });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateProfile,
  sendLike
};
