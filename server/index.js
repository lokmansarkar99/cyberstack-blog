const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config(); // Load environment variables

const app = express();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(fileUpload({ useTempFiles: true })); // Enable file upload with temp file storage

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  })
);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Cloudinary File Upload Endpoint Example
app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'blogImages', // Specify Cloudinary folder
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      url: result.secure_url, // Return the Cloudinary URL
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Error Handling Middleware
app.use(notFound); // Handle 404 errors
app.use(errorHandler); // Custom error handler

// MongoDB Connection and Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MongoDB connection URI is missing in environment variables.');
  process.exit(1); // Exit if no connection string is provided
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1); // Exit if unable to connect to the database
  });
