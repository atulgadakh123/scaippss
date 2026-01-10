import express from 'express';
import { upload, getFileUrl } from '../middleware/simpleUploadMiddleware.js';

const router = express.Router();

// Simple upload endpoint - NO authentication required
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    console.log('\n🚀 === FILE UPLOAD ===');

    if (!req.file) {
      console.error('❌ No file received');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log('📎 File:', req.file.filename);
    console.log('📦 Size:', req.file.size, 'bytes');
    console.log('📝 MIME:', req.file.mimetype);

    // Get full URL
    const fileUrl = getFileUrl(req.file.filename);

    console.log('🌐 URL:', fileUrl);
    console.log('✅ === UPLOAD COMPLETE ===\n');

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
