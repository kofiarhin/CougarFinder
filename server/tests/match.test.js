const dayjs = require('dayjs');
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
});
