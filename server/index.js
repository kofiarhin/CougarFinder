require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
const http = require('http');
const path = require('path');
const fs = require('fs');
const createApp = require('./app');
const { connectDb } = require('./utils/db');
const { initSocket } = require('./socket');

const ensureUploadRoot = () => {
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const start = async () => {
  ensureUploadRoot();
  await connectDb();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = {
  start
};
