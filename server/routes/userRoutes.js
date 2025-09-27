const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMe, updateProfile, sendLike } = require('../controllers/userController');
const { listImages, uploadImages, setPrimaryImage, deleteImage } = require('../controllers/imageController');
const { upload } = require('../utils/imageStorage');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.patch('/me', updateProfile);
router.post('/like', sendLike);

router.get('/me/images', listImages);
router.post('/me/images', upload.array('images', 4), uploadImages);
router.patch('/me/images/:imageId/primary', setPrimaryImage);
router.delete('/me/images/:imageId', deleteImage);

module.exports = router;
