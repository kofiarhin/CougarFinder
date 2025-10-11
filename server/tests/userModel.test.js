const dayjs = require('dayjs');
const { User, applyUserIndexes } = require('../models/User');

describe('User model schema', () => {
  it('defines a geospatial index for location searches', () => {
    const indexes = User.schema.indexes();
    const hasGeoIndex = indexes.some(([fields]) => fields.location === '2dsphere');

    expect(hasGeoIndex).toBe(true);
  });

  it('keeps index registration idempotent', () => {
    const initialCount = User.schema.indexes().length;
    applyUserIndexes();
    const afterCount = User.schema.indexes().length;

    expect(afterCount).toBe(initialCount);
  });

  it('applies default location coordinates when not provided', async () => {
    const user = await User.create({
      email: `geo${Date.now()}@example.com`,
      passwordHash: 'hash',
      dateOfBirth: dayjs().subtract(30, 'year').toDate(),
      gender: 'female'
    });

    expect(user.location.coordinates).toEqual([0, 0]);
  });
});
