const { Like } = require('../models/Like');
const { createUserAndToken } = require('./helpers');

describe('User likes', () => {
  it('creates a like with correct user references and avoids duplicates', async () => {
    const { user: liker, token } = await createUserAndToken({ email: 'liker@example.com' });
    const { user: target } = await createUserAndToken({ email: 'target@example.com' });

    const payload = { targetUserId: target._id.toString() };

    const firstResponse = await global.request
      .post('/api/users/like')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.like.fromUserId).toBe(liker._id.toString());
    expect(firstResponse.body.like.toUserId).toBe(target._id.toString());

    const secondResponse = await global.request
      .post('/api/users/like')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(secondResponse.status).toBe(200);

    const likes = await Like.find({ fromUserId: liker._id, toUserId: target._id });
    expect(likes).toHaveLength(1);
  });
});
