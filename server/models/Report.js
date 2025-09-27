const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    photoId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ['open', 'reviewing', 'resolved'], default: 'open' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const Report = mongoose.model('Report', ReportSchema);

module.exports = {
  Report
};
