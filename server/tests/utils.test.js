const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const { buildCorsOptions, buildSocketCorsOptions } = require('../utils/cors');
const { buildImagePayload, deleteFile } = require('../utils/imageStorage');
const { signToken, verifySocketToken } = require('../utils/token');

describe('CORS utilities', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns wildcard origin in development when not configured', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGIN;

    const options = buildCorsOptions();

    expect(options).toEqual({ origin: '*', credentials: true });
  });

  it('parses single and multiple origins in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://app.devkofi.com, https://studio.devkofi.com';

    const options = buildCorsOptions();
    expect(options.origin).toEqual([
      'https://app.devkofi.com',
      'https://studio.devkofi.com'
    ]);

    const socketOptions = buildSocketCorsOptions();
    expect(socketOptions.origin).toEqual([
      'https://app.devkofi.com',
      'https://studio.devkofi.com'
    ]);
  });

  it('returns a single origin string when only one value is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://solo.devkofi.com';

    const options = buildCorsOptions();
    expect(options.origin).toBe('https://solo.devkofi.com');

    const socketOptions = buildSocketCorsOptions();
    expect(socketOptions.origin).toEqual(['https://solo.devkofi.com']);
  });

  it('throws in production when origins are missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGIN;

    expect(() => buildCorsOptions()).toThrow('CORS_ORIGIN must be defined in production');
  });
});

describe('Token helpers', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = '1d';
  });

  it('throws when signing without a configured secret', () => {
    delete process.env.JWT_SECRET;

    expect(() => signToken({ _id: '1', email: 'user@example.com' })).toThrow(
      'JWT_SECRET is not configured'
    );
  });

  it('verifies socket tokens and returns null for invalid tokens', () => {
    process.env.JWT_SECRET = 'secret';
    const token = jwt.sign({ id: 'user-id', email: 'user@example.com' }, process.env.JWT_SECRET);

    expect(verifySocketToken(token)).toMatchObject({ id: 'user-id' });
    expect(verifySocketToken(null)).toBeNull();
    process.env.JWT_SECRET = undefined;
    expect(verifySocketToken(token)).toBeNull();
  });

  it('falls back to the default expiration when not configured', () => {
    process.env.JWT_SECRET = 'secret';
    delete process.env.JWT_EXPIRES_IN;
    const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token');

    const token = signToken({ _id: { toString: () => '1' }, email: 'user@example.com' });

    expect(token).toBe('token');
    expect(signSpy).toHaveBeenCalledWith(
      { id: '1', email: 'user@example.com' },
      'secret',
      { expiresIn: '7d' }
    );

    signSpy.mockRestore();
  });
});

describe('Database helpers', () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock('mongoose');
  });

  it('throws when MONGO_URI is not provided', async () => {
    let connectDb;
    jest.isolateModules(() => {
      jest.doMock('mongoose', () => ({
        connection: { readyState: 0 },
        set: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
      }));
      ({ connectDb } = require('../utils/db'));
    });

    await expect(connectDb()).rejects.toThrow('MONGO_URI is not defined');
  });

  it('reuses existing connections', async () => {
    const readyConnection = { readyState: 1 };
    let connectDb;
    jest.isolateModules(() => {
      jest.doMock('mongoose', () => ({
        connection: readyConnection,
        set: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn()
      }));
      ({ connectDb } = require('../utils/db'));
    });

    const connection = await connectDb('mongodb://localhost/test');
    expect(connection).toBe(readyConnection);
  });

  it('handles disconnect errors gracefully', async () => {
    const disconnectMock = jest.fn(() => {
      throw new Error('disconnect failure');
    });
    let disconnectDb;
    jest.isolateModules(() => {
      jest.doMock('mongoose', () => ({
        connection: { readyState: 1 },
        set: jest.fn(),
        connect: jest.fn().mockResolvedValue({}),
        disconnect: disconnectMock
      }));
      ({ disconnectDb } = require('../utils/db'));
    });

    process.env.NODE_ENV = 'development';
    await expect(disconnectDb()).resolves.toBeUndefined();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('suppresses disconnect warnings in production', async () => {
    const disconnectMock = jest.fn(() => {
      throw new Error('disconnect failure');
    });
    let disconnectDb;
    jest.isolateModules(() => {
      jest.doMock('mongoose', () => ({
        connection: { readyState: 1 },
        set: jest.fn(),
        connect: jest.fn(),
        disconnect: disconnectMock
      }));
      ({ disconnectDb } = require('../utils/db'));
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    await expect(disconnectDb()).resolves.toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('Image storage helpers', () => {
  const tempDir = path.join(__dirname, 'temp-files');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    jest.resetModules();
    jest.unmock('multer');
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('builds an image payload with predictable fields', () => {
    const payload = buildImagePayload('1234', 'photo.png');

    expect(payload.filename).toBe('photo.png');
    expect(payload.ext).toBe('png');
    expect(payload.paths.public).toBe(path.posix.join('uploads', '1234', 'photo.png'));
    expect(payload.paths.thumb).toBe(payload.paths.public);
    expect(payload.isPrimary).toBe(false);
  });

  it('removes files when they exist and ignores missing files', () => {
    const filePath = path.join(tempDir, 'to-delete.txt');
    fs.writeFileSync(filePath, 'temporary');

    expect(fs.existsSync(filePath)).toBe(true);
    deleteFile(filePath);
    expect(fs.existsSync(filePath)).toBe(false);

    expect(() => deleteFile(path.join(tempDir, 'missing.txt'))).not.toThrow();
  });

  it('configures multer storage callbacks for uploads', () => {
    let captured;
    jest.isolateModules(() => {
      jest.doMock('multer', () => {
        const actual = jest.requireActual('multer');
        const multerProxy = (...args) => actual(...args);
        return Object.assign(multerProxy, actual, {
          diskStorage: jest.fn((config) => {
            captured = config;
            return actual.diskStorage(config);
          })
        });
      });
      const { upload } = require('../utils/imageStorage');
      expect(upload).toBeDefined();
    });

    const req = { user: { _id: { toString: () => 'abc123' } } };
    const destinationCb = jest.fn();
    captured.destination(req, { originalname: 'avatar.png' }, destinationCb);
    expect(destinationCb).toHaveBeenCalledWith(null, expect.stringContaining('abc123'));

    const filenameCb = jest.fn();
    captured.filename(req, { originalname: 'avatar' }, filenameCb);
    const generatedName = filenameCb.mock.calls[0][1];
    expect(generatedName.endsWith('.jpg')).toBe(true);
  });
});
