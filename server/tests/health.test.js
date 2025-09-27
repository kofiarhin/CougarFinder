describe('GET /api/health', () => {
  it('returns the service health payload', async () => {
    const response = await global.request.get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, service: 'CougarFinder' });
  });
});
