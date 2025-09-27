const path = require('path');
const fs = require('fs');
const http = require('http');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '0';
process.env.UPLOAD_DIR = path.join(__dirname, '..', 'temp', 'test-uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(process.env.UPLOAD_DIR);

const createApp = require('../app');
const { connectDb, disconnectDb } = require('../utils/db');
const { initSocket } = require('../socket');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDb(mongoServer.getUri());
  const app = createApp();
  const server = http.createServer(app);
  const io = initSocket(server);
  await new Promise((resolve) => {
    server.listen(0, resolve);
  });
  const address = server.address();
  global.__APP__ = app;
  global.__SERVER__ = server;
  global.__IO__ = io;
  global.__TEST_AGENT_URL__ = `http://127.0.0.1:${address.port}`;
  global.request = supertest(app);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await disconnectDb();
  if (global.__SERVER__) {
    await new Promise((resolve) => global.__SERVER__.close(resolve));
  }
  if (global.__IO__) {
    global.__IO__.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  if (fs.existsSync(process.env.UPLOAD_DIR)) {
    fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
  }
});
