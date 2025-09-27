const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

LikeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

const Like = mongoose.model('Like', LikeSchema);

module.exports = {
  Like
};
