const fs = require('fs');
const path = require('path');

const resolveUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.cwd(), process.env.UPLOAD_DIR);
  }

  return path.join(__dirname, '..', 'uploads');
};

const ensureDir = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    return;
  }

  fs.mkdirSync(dirPath, { recursive: true });
};

const run = () => {
  const uploadDir = resolveUploadDir();
  ensureDir(uploadDir);
  process.stdout.write(`Server build step complete. Upload directory ready at: ${uploadDir}\n`);
};

run();
