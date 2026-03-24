const { createUserAndToken } = require('./helpers');

describe('Reports', () => {
  describe('POST /api/reports', () => {
    it('creates a report successfully', async () => {
      const { token, user } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target@example.com' });

      const res = await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString(), reason: 'harassment' });

      expect(res.status).toBe(201);
      expect(res.body.report.reason).toBe('harassment');
      expect(res.body.report.reporterId).toBe(user._id.toString());
      expect(res.body.report.status).toBe('open');
    });

    it('returns 400 when targetUserId is missing', async () => {
      const { token } = await createUserAndToken();

      const res = await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'spam' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when reason is missing', async () => {
      const { token } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target2@example.com' });

      const res = await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString() });

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await global.request
        .post('/api/reports')
        .send({ targetUserId: 'some-id', reason: 'spam' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports', () => {
    it('lists all reports', async () => {
      const { token, user } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target3@example.com' });

      await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString(), reason: 'fake profile' });

      const res = await global.request
        .get('/api/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBe(1);
      expect(res.body.reports[0].reason).toBe('fake profile');
    });

    it('filters reports by status', async () => {
      const { token } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target4@example.com' });

      await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString(), reason: 'spam' });

      const resOpen = await global.request
        .get('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'open' });
      expect(resOpen.body.reports.length).toBe(1);

      const resResolved = await global.request
        .get('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'resolved' });
      expect(resResolved.body.reports.length).toBe(0);
    });

    it('returns 401 without auth', async () => {
      const res = await global.request.get('/api/reports');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/reports/:id/status', () => {
    it('updates report status', async () => {
      const { token } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target5@example.com' });

      const createRes = await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString(), reason: 'harassment' });

      const reportId = createRes.body.report._id;

      const patchRes = await global.request
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'reviewing' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.report.status).toBe('reviewing');
    });

    it('returns 400 for invalid status', async () => {
      const { token } = await createUserAndToken();
      const { user: target } = await createUserAndToken({ email: 'target6@example.com' });

      const createRes = await global.request
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: target._id.toString(), reason: 'spam' });

      const reportId = createRes.body.report._id;

      const patchRes = await global.request
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid-status' });

      expect(patchRes.status).toBe(400);
    });

    it('returns 404 for unknown report id', async () => {
      const { token } = await createUserAndToken();

      const res = await global.request
        .patch('/api/reports/000000000000000000000000/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(404);
    });
  });
});
