const path = require('path');
const { User } = require('../models/User');
const { buildImagePayload, uploadsRoot, deleteFile } = require('../utils/imageStorage');

const listImages = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ images: user.images });
  } catch (error) {
    next(error);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.images.length + req.files.length > 4) {
      req.files.forEach((file) => deleteFile(file.path));
      return res.status(400).json({ message: 'Maximum of 4 images allowed' });
    }
    const newImages = req.files.map((file) => buildImagePayload(user._id, path.basename(file.path)));
    user.images.push(...newImages);
    user.counters.photoCount = user.images.length;
    if (!user.hasPrimary && user.images.length > 0) {
      user.images[0].isPrimary = true;
      user.hasPrimary = true;
    }
    await user.save();
    res.status(201).json({ images: user.images });
  } catch (error) {
    next(error);
  }
};

const setPrimaryImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const user = await User.findById(req.user._id);
    const image = user.images.id(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    user.images.forEach((img) => {
      img.isPrimary = img._id.equals(image._id);
    });
    user.hasPrimary = true;
    await user.save();
    res.json({ images: user.images });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const user = await User.findById(req.user._id);
    const image = user.images.id(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    const absolutePath = path.join(uploadsRoot, req.user._id.toString(), image.filename);
    deleteFile(absolutePath);
    image.remove();
    user.counters.photoCount = user.images.length;
    if (!user.images.some((img) => img.isPrimary)) {
      user.hasPrimary = false;
    }
    await user.save();
    res.json({ images: user.images });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listImages,
  uploadImages,
  setPrimaryImage,
  deleteImage
};
