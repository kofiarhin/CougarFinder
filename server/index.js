require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
const http = require('http');
const path = require('path');
const fs = require('fs');
const createApp = require('./app');
const { connectDb, disconnectDb } = require('./utils/db');
const { initSocket } = require('./socket');

let memoryServer;
let httpServer;
let ioServer;

const ensureUploadRoot = () => {
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const resolveMongoUri = async () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const canUseMemory = process.env.NODE_ENV !== 'production' || process.env.USE_IN_MEMORY_DB === 'true';

  if (!canUseMemory) {
    throw new Error('MONGO_URI is not defined');
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
};

const start = async () => {
  ensureUploadRoot();
  const mongoUri = await resolveMongoUri();
  await connectDb(mongoUri);
  const app = createApp();
  httpServer = http.createServer(app);
  ioServer = initSocket(httpServer);
  const port = process.env.PORT || 5000;

  await new Promise((resolve) => {
    httpServer.listen(port, resolve);
  });

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  }

  return { app, server: httpServer, io: ioServer };
};

const stop = async () => {
  if (ioServer) {
    ioServer.close();
    ioServer = null;
  }

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = null;
  }

  await disconnectDb();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

if (require.main === module) {
  start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

  const shutdownSignals = ['SIGINT', 'SIGTERM'];
  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      await stop();
      process.exit(0);
    });
  });
}

module.exports = {
  start,
  stop
};
