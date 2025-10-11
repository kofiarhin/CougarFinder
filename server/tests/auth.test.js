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

  it('prevents duplicate registrations', async () => {
    const email = `dupe${Date.now()}@example.com`;
    const payload = {
      email,
      password: 'Passw0rd!',
      dateOfBirth: dayjs().subtract(26, 'year').toDate(),
      gender: 'female',
      orientation: ['male'],
      location: { type: 'Point', coordinates: [-73.935242, 40.73061] }
    };

    const first = await global.request.post('/api/auth/signup').send(payload);
    expect(first.status).toBe(201);

    const second = await global.request.post('/api/auth/signup').send(payload);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe('Email already registered');
  });

  it('rejects login attempts with invalid credentials', async () => {
    const email = `invalid${Date.now()}@example.com`;
    const payload = {
      email,
      password: 'Passw0rd!',
      dateOfBirth: dayjs().subtract(26, 'year').toDate(),
      gender: 'female',
      orientation: ['male'],
      location: { type: 'Point', coordinates: [-73.935242, 40.73061] }
    };

    const signupRes = await global.request.post('/api/auth/signup').send(payload);
    expect(signupRes.status).toBe(201);

    const badPasswordRes = await global.request
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass1!' });
    expect(badPasswordRes.status).toBe(401);
    expect(badPasswordRes.body.message).toBe('Invalid credentials');

    const badEmailRes = await global.request
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPass1!' });
    expect(badEmailRes.status).toBe(401);
    expect(badEmailRes.body.message).toBe('Invalid credentials');
  });
});
