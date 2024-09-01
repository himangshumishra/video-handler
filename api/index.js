const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${baseName}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mkv/;
    const isExtNameValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isMimeTypeValid = allowedTypes.test(file.mimetype);
    if (isExtNameValid && isMimeTypeValid) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  },
});

// Endpoint to handle video chunk upload
app.post('/api/upload', upload.single('video'), (req, res) => {
  // Check if a file is included in the request
  if (!req.file) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'No video file uploaded' 
    });
  }

  console.log(`Uploaded: ${req.file.filename}`);

  res.status(200).json({ 
    status: 'success', 
    message: 'Video chunk uploaded successfully', 
    file: {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size, // in bytes
      mimeType: req.file.mimetype,
      path: req.file.path,
    }
  });
});

module.exports = app;