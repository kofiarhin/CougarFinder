const dayjs = require('dayjs');
const { User } = require('../models/User');
const { hashPassword } = require('../utils/password');
const { signToken } = require('../utils/token');

const buildUserPayload = (overrides = {}) => ({
  email: `user${Math.random().toString(16).slice(2)}@example.com`,
  password: 'Password123!',
  dateOfBirth: dayjs().subtract(25, 'year').toDate(),
  gender: 'female',
  orientation: ['male'],
  location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
  profile: {
    bio: 'Test bio',
    preferences: {
      minAge: 21,
      maxAge: 35,
      distance: 100,
      genders: ['male']
    }
  },
  ...overrides
});

const createUserAndToken = async (overrides = {}) => {
  const payload = buildUserPayload(overrides);
  const passwordHash = await hashPassword(payload.password);
  const user = await User.create({
    email: payload.email,
    passwordHash,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    orientation: payload.orientation,
    location: payload.location,
    profile: payload.profile
  });
  const token = signToken(user);
  return { user, token, password: payload.password };
};

module.exports = {
  buildUserPayload,
  createUserAndToken
};
