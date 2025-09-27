const dayjs = require('dayjs');

describe('Auth endpoints', () => {
  it('registers a new user and returns token', async () => {
    const payload = {
      email: `test${Date.now()}@example.com`,
      password: 'Passw0rd!',
      dateOfBirth: dayjs().subtract(24, 'year').toDate(),
      gender: 'female',
      orientation: ['male'],
      location: { type: 'Point', coordinates: [-73.935242, 40.73061] }
    };
    const res = await global.request.post('/api/auth/signup').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(payload.email);
  });

  it('logs in an existing user', async () => {
    const email = `login${Date.now()}@example.com`;
    const signupRes = await global.request.post('/api/auth/signup').send({
      email,
      password: 'Passw0rd!',
      dateOfBirth: dayjs().subtract(26, 'year').toDate(),
      gender: 'male',
      orientation: ['female'],
      location: { type: 'Point', coordinates: [-73.935242, 40.73061] }
    });
    expect(signupRes.status).toBe(201);
    const loginRes = await global.request.post('/api/auth/login').send({ email, password: 'Passw0rd!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
  });
});
