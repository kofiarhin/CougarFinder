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

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    const filter = { fromUserId: req.user._id, toUserId: targetUserId };
    const update = {
      $setOnInsert: {
        fromUserId: req.user._id,
        toUserId: targetUserId
      }
    };

    const result = await Like.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      rawResult: true
    });

    const like = result.value;
    const wasCreated = !(result.lastErrorObject && result.lastErrorObject.updatedExisting);

    const likeResponse = {
      ...like,
      _id: like._id.toString(),
      fromUserId: like.fromUserId.toString(),
      toUserId: like.toUserId.toString()
    };

    res.status(wasCreated ? 201 : 200).json({ like: likeResponse });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateProfile,
  sendLike
};
