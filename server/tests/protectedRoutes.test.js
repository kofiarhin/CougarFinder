describe('Protected route authentication', () => {
  const unauthenticatedRoutes = [
    { method: 'get', path: '/api/users/me' },
    { method: 'patch', path: '/api/users/me', payload: { profile: { bio: 'No auth' } } },
    { method: 'post', path: '/api/users/like', payload: { targetUserId: '507f1f77bcf86cd799439011' } },
    { method: 'get', path: '/api/users/me/images' },
    { method: 'get', path: '/api/messages' },
    { method: 'get', path: '/api/messages/thread?withUserId=507f1f77bcf86cd799439011' },
    { method: 'get', path: '/api/matches' }
  ];

  it('returns 401 for all key protected endpoints without a bearer token', async () => {
    for (const { method, path, payload } of unauthenticatedRoutes) {
      const request = global.request[method](path);
      const response = payload ? await request.send(payload) : await request;

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    }
  });
});
