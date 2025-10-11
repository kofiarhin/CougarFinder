describe('Express app bootstrap', () => {
  it('falls back to the local uploads directory when not configured', () => {
    const originalUploadDir = process.env.UPLOAD_DIR;
    delete process.env.UPLOAD_DIR;

    let app;
    jest.isolateModules(() => {
      const createApp = require('../app');
      app = createApp();
    });

    expect(app).toBeDefined();

    process.env.UPLOAD_DIR = originalUploadDir;
  });
});
