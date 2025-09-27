const dayjs = require('dayjs');
const { User } = require('../models/User');

const buildAgeFilter = (minAge, maxAge) => {
  const now = dayjs();
  const maxDob = now.subtract(minAge || 18, 'year').endOf('day').toDate();
  const minDob = now.subtract(maxAge || 99, 'year').startOf('day').toDate();
  return { $gte: minDob, $lte: maxDob };
};

const browseMatches = async (req, res, next) => {
  try {
    const { ageMin, ageMax, distance, orientations } = req.query;
    const user = req.user;
    const filters = {
      _id: { $ne: user._id },
      status: 'active'
    };
    if (ageMin || ageMax) {
      filters.dateOfBirth = buildAgeFilter(Number(ageMin) || 18, Number(ageMax) || 99);
    }
    if (orientations) {
      const parsed = orientations.split(',');
      filters.orientation = { $in: parsed };
    }
    let query = User.find(filters).select('-passwordHash');
    if (user.location && user.location.coordinates && typeof distance !== 'undefined') {
      const distMeters = Number(distance) * 1000 || user.profile.preferences.distance * 1000;
      query = query.where('location').near({
        center: { type: 'Point', coordinates: user.location.coordinates },
        maxDistance: distMeters
      });
    }
    const results = await query.limit(50);
    res.json({ matches: results });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  browseMatches
};
