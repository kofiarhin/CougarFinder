const { User } = require('../models/User');
const { createUserAndToken } = require('./helpers');

describe('User profile endpoints', () => {
  it('returns the authenticated user data', async () => {
    const { token, user } = await createUserAndToken({ email: 'profile@example.com' });

    const response = await global.request.get('/api/users/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(user.email);
  });

  it('updates mutable profile fields', async () => {
    const { token } = await createUserAndToken({ email: 'update@example.com' });

    const patchResponse = await global.request
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: { bio: 'Updated bio' } });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.user.profile.bio).toBe('Updated bio');
  });

  it('requires a target user when liking someone', async () => {
    const { token } = await createUserAndToken({ email: 'liker-missing@example.com' });

    const response = await global.request
      .post('/api/users/like')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('targetUserId is required');
  });

  it('prevents liking your own profile', async () => {
    const { token, user } = await createUserAndToken({ email: 'self-like@example.com' });

    const response = await global.request
      .post('/api/users/like')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetUserId: user._id.toString() });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Cannot like yourself');
  });

  it('returns 401 when authentication header is missing', async () => {
    const response = await global.request.get('/api/users/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('rejects tokens referencing deleted users', async () => {
    const { token, user } = await createUserAndToken({ email: 'ghost@example.com' });
    await User.deleteOne({ _id: user._id });

    const response = await global.request.get('/api/users/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token');
  });
});
