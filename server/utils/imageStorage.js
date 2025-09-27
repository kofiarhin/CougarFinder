const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const uploadsRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
ensureDir(uploadsRoot);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsRoot, req.user._id.toString());
    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { files: 4, fileSize: 5 * 1024 * 1024 }
});

const buildImagePayload = (userId, filename) => {
  const ext = path.extname(filename).replace('.', '');
  const publicPath = path.posix.join('uploads', userId.toString(), filename);
  const thumbPath = publicPath;
  return {
    filename,
    ext,
    paths: { public: publicPath, thumb: thumbPath },
    isPrimary: false,
    createdAt: new Date()
  };
};

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  upload,
  uploadsRoot,
  buildImagePayload,
  deleteFile
};
