const jwt = require('jsonwebtoken');
const { errorHandler } = require('../middleware/errorHandler');
const { notFoundHandler } = require('../middleware/notFound');
const { authRateLimiter, createRateLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/authMiddleware');

describe('Middleware behaviors', () => {
  it('formats errors when headers are writable', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const error = new Error('Boom');

    errorHandler(error, {}, res, () => {});

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ ok: false, message: 'Boom', errors: undefined });
  });

  it('falls back to the default error message when none is provided', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    errorHandler({}, {}, { headersSent: false, status }, () => {});

    expect(json).toHaveBeenCalledWith({ ok: false, message: 'Internal server error', errors: undefined });
  });

  it('logs errors outside of the test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = { headersSent: false, status: jest.fn(() => ({ json: jest.fn() })) };

    errorHandler(new Error('logged'), {}, res, () => {});

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it('delegates when headers have already been sent', () => {
    const next = jest.fn();
    const error = new Error('late error');

    errorHandler(error, {}, { headersSent: true }, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('emits a 404 payload for unknown routes', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    notFoundHandler({}, { status });

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ ok: false, message: 'Route not found' });
  });

  it('rate limits repeated authentication attempts', () => {
    const next = jest.fn();
    const sendResponse = jest.fn();
    const res = { status: jest.fn(() => ({ json: sendResponse })) };
    const limiter = authRateLimiter;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      limiter({ ip: '1.2.3.4' }, res, next);
    }

    expect(next).toHaveBeenCalledTimes(20);

    limiter({ ip: '1.2.3.4' }, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      message: 'Too many authentication attempts. Please wait before retrying.'
    });
  });

  it('falls back to alternate client identifiers', () => {
    const limiter = authRateLimiter;
    const next = jest.fn();

    limiter({ ip: null, connection: { remoteAddress: '5.6.7.8' } }, { status: jest.fn(), json: jest.fn() }, next);
    limiter({ ip: null, connection: null }, { status: jest.fn(), json: jest.fn() }, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('uses the default rate limit message when none is provided', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };

    limiter({ ip: '1.1.1.1' }, res, jest.fn());
    limiter({ ip: '1.1.1.1' }, res, jest.fn());

    expect(json).toHaveBeenCalledWith({
      ok: false,
      message: 'Too many requests, please try again later.'
    });
  });

  it('bubbles JWT verification failures', async () => {
    const token = 'bad-token';
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn(() => ({ json: jest.fn() })) };
    const next = jest.fn();
    const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const errorArg = next.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe('jwt malformed');

    verifySpy.mockRestore();
  });
});
