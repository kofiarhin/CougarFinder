const { Report } = require('../models/Report');

const submitReport = async (req, res, next) => {
  try {
    const { targetUserId, photoId, reason, details } = req.body;
    if (!targetUserId || !reason) {
      return res.status(400).json({ message: 'targetUserId and reason are required' });
    }
    const report = await Report.create({
      reporterId: req.user._id,
      targetUserId,
      photoId: photoId || undefined,
      reason,
      details
    });
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['open', 'reviewing', 'resolved'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }
    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReport,
  listReports,
  updateReportStatus
};
