const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mkv/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtNameValid = allowedTypes.test(ext);
    const isMimeTypeValid = allowedTypes.test(file.mimetype);

    if (isExtNameValid && isMimeTypeValid) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
});

const app = express();
const port = process.env.PORT || 3000;

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    const readable = new Readable();
    readable._read = () => {}; 
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// Endpoint to handle video chunk upload
app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No video file uploaded' });
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'video',
      public_id: `uploads/${path.basename(req.file.originalname, path.extname(req.file.originalname))}-${Date.now()}`,
      overwrite: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Video uploaded successfully',
      file: {
        originalName: req.file.originalname,
        url: result.secure_url,
        size: req.file.size, // in bytes
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;