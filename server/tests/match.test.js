const dayjs = require('dayjs');
const { buildAgeFilter } = require('../controllers/matchController');
const { createUserAndToken } = require('./helpers');

describe('Match browsing', () => {
  it('returns matches filtered by age', async () => {
    const { token } = await createUserAndToken({
      gender: 'female',
      orientation: ['male'],
      dateOfBirth: dayjs().subtract(28, 'year').toDate(),
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] }
    });
    await createUserAndToken({
      email: 'candidate1@example.com',
      gender: 'male',
      orientation: ['female'],
      dateOfBirth: dayjs().subtract(30, 'year').toDate(),
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] }
    });
    await createUserAndToken({
      email: 'candidate2@example.com',
      gender: 'male',
      orientation: ['female'],
      dateOfBirth: dayjs().subtract(45, 'year').toDate(),
      location: { type: 'Point', coordinates: [-74.006, 40.7128] }
    });

    const res = await global.request
      .get('/api/matches')
      .set('Authorization', `Bearer ${token}`)
      .query({ ageMin: 25, ageMax: 35, distance: 10 });

    expect(res.status).toBe(200);
    expect(res.body.matches.length).toBe(1);
    expect(res.body.matches[0].email).toBe('candidate1@example.com');
  });

  it('supports explicit orientation filters without distance constraint', async () => {
    const { token } = await createUserAndToken({
      gender: 'female',
      orientation: ['male']
    });

    await createUserAndToken({
      email: 'filtered-in@example.com',
      gender: 'male',
      orientation: ['male']
    });
    await createUserAndToken({
      email: 'filtered-out@example.com',
      gender: 'female',
      orientation: ['female']
    });

    const res = await global.request
      .get('/api/matches')
      .set('Authorization', `Bearer ${token}`)
      .query({ orientations: 'male' });

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].email).toBe('filtered-in@example.com');
  });

  it('falls back to default distance and age ranges when zeros are provided', async () => {
    const { token } = await createUserAndToken({
      gender: 'female',
      orientation: ['male'],
      profile: {
        bio: 'Test',
        preferences: { minAge: 25, maxAge: 40, distance: 75, genders: ['male'] }
      }
    });
    await createUserAndToken({
      email: 'default-range@example.com',
      gender: 'male',
      orientation: ['female'],
      dateOfBirth: dayjs().subtract(30, 'year').toDate(),
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] }
    });

    const res = await global.request
      .get('/api/matches')
      .set('Authorization', `Bearer ${token}`)
      .query({ ageMin: 0, ageMax: 0, distance: 0 });

    expect(res.status).toBe(200);
    expect(res.body.matches.length).toBeGreaterThan(0);
  });
});

describe('buildAgeFilter helper', () => {
  it('uses default bounds when ages are not provided', () => {
    const reference = dayjs('2024-06-15');
    const filter = buildAgeFilter(undefined, undefined, reference);
    const expectedMax = dayjs(reference).subtract(18, 'year').endOf('day').toDate();
    const expectedMin = dayjs(reference).subtract(99, 'year').startOf('day').toDate();

    expect(filter).toEqual({ $gte: expectedMin, $lte: expectedMax });
  });

  it('applies explicit age ranges', () => {
    const reference = dayjs('2024-06-15');
    const filter = buildAgeFilter(25, 35, reference);
    const expectedMax = dayjs(reference).subtract(25, 'year').endOf('day').toDate();
    const expectedMin = dayjs(reference).subtract(35, 'year').startOf('day').toDate();

    expect(filter.$lte).toEqual(expectedMax);
    expect(filter.$gte).toEqual(expectedMin);
  });
});
