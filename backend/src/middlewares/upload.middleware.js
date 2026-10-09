import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { config, cloudinaryEnabled } from '../config.js';

export const MAX_IMAGES = 3;

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
} else {
  console.warn('[upload] Cloudinary is not configured; image uploads are disabled');
}

const storage = cloudinaryEnabled
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'campusfound/items',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'images'));
    }
    cb(null, true);
  },
});

export const uploadImages = upload.array('images', MAX_IMAGES);

// Maps uploaded files to the shape stored on the item. Without Cloudinary the
// files only exist in memory, so they are dropped.
export const uploadedImages = (files = []) =>
  cloudinaryEnabled ? files.map((f) => ({ url: f.path, public_id: f.filename })) : [];

export const destroyImages = async (images = []) => {
  if (!cloudinaryEnabled) return;
  await Promise.all(
    images.map((img) =>
      cloudinary.uploader.destroy(img.public_id).catch((err) =>
        console.error(`[upload] failed to delete image ${img.public_id}:`, err.message)
      )
    )
  );
};
