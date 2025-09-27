const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    convoId: { type: String, required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    deliveredAt: { type: Date },
    readAt: { type: Date }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const Message = mongoose.model('Message', MessageSchema);

module.exports = {
  Message
};
