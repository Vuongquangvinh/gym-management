import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const uploadDirs = [
    path.join(__dirname, '../../../../frontend_react/public/uploads'),
    path.join(__dirname, '../../../../frontend_react/public/uploads/employees'),
    path.join(__dirname, '../../../../frontend_react/public/uploads/employees/avatars'),
    path.join(__dirname, '../../../../frontend_react/public/uploads/pt'),
    path.join(__dirname, '../../../../frontend_react/public/uploads/pt/certificates'),
    path.join(__dirname, '../../../../frontend_react/public/uploads/pt/achievements')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Configure multer for employee avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../../frontend_react/public/uploads/employees/avatars');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use the filename from request body or generate one
    const fileName = req.body.fileName || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    cb(null, fileName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file JPG, JPEG, PNG'));
    }
  }
});

// Configure multer for PT certificate uploads
const certificateStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../../frontend_react/public/uploads/pt/certificates');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    cb(null, fileName);
  }
});

const certificateUpload = multer({
  storage: certificateStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file JPG, JPEG, PNG'));
    }
  }
});

// Configure multer for PT achievement uploads
const achievementStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../../frontend_react/public/uploads/pt/achievements');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `achiev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    cb(null, fileName);
  }
});

const achievementUpload = multer({
  storage: achievementStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file JPG, JPEG, PNG'));
    }
  }
});

// Upload employee avatar endpoint
router.post('/employee-avatar', avatarUpload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload'
      });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/employees/avatars/${fileName}`;

    res.json({
      success: true,
      fileName: fileName,
      path: filePath,
      url: filePath, // Frontend sẽ dùng path này
      size: req.file.size,
      originalName: req.file.originalname
    });

    console.log(`✅ Employee avatar uploaded: ${fileName} (${req.file.size} bytes)`);
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi upload file'
    });
  }
});

// Delete employee avatar endpoint
router.delete('/employee-avatar/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../../../../frontend_react/public/uploads/employees/avatars', fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Employee avatar deleted: ${fileName}`);
      res.json({ 
        success: true, 
        message: 'File đã được xóa thành công' 
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File không tồn tại'
      });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi xóa file'
    });
  }
});

// Get file info endpoint
router.get('/employee-avatar/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../../../../frontend_react/public/uploads/employees/avatars', fileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        success: true,
        fileName: fileName,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File không tồn tại'
      });
    }
  } catch (error) {
    console.error('❌ File info error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi lấy thông tin file'
    });
  }
});

// List all employee avatars endpoint
router.get('/employee-avatars', (req, res) => {
  try {
    const uploadPath = path.join(__dirname, '../../../../frontend_react/public/uploads/employees/avatars');
    
    if (!fs.existsSync(uploadPath)) {
      return res.json({
        success: true,
        files: []
      });
    }

    const files = fs.readdirSync(uploadPath)
      .filter(file => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        return allowedExtensions.includes(path.extname(file).toLowerCase());
      })
      .map(file => {
        const filePath = path.join(uploadPath, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/employees/avatars/${file}`
        };
      });

    res.json({
      success: true,
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error('❌ List files error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi lấy danh sách file'
    });
  }
});

// Upload PT certificate image endpoint
router.post('/pt-certificate', certificateUpload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload'
      });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/pt/certificates/${fileName}`;

    res.json({
      success: true,
      fileName: fileName,
      path: filePath,
      url: filePath,
      size: req.file.size,
      originalName: req.file.originalname
    });

    console.log(`✅ PT Certificate uploaded: ${fileName} (${req.file.size} bytes)`);
  } catch (error) {
    console.error('❌ Certificate upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi upload file'
    });
  }
});

// Upload PT achievement image endpoint
router.post('/pt-achievement', achievementUpload.single('achievement'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload'
      });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/pt/achievements/${fileName}`;

    res.json({
      success: true,
      fileName: fileName,
      path: filePath,
      url: filePath,
      size: req.file.size,
      originalName: req.file.originalname
    });

    console.log(`✅ PT Achievement uploaded: ${fileName} (${req.file.size} bytes)`);
  } catch (error) {
    console.error('❌ Achievement upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi upload file'
    });
  }
});

// Delete PT certificate image endpoint
router.delete('/pt-certificate/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../../../../frontend_react/public/uploads/pt/certificates', fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ PT Certificate deleted: ${fileName}`);
      res.json({ 
        success: true, 
        message: 'File đã được xóa thành công' 
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File không tồn tại'
      });
    }
  } catch (error) {
    console.error('❌ Delete certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi xóa file'
    });
  }
});

// Delete PT achievement image endpoint
router.delete('/pt-achievement/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../../../../frontend_react/public/uploads/pt/achievements', fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ PT Achievement deleted: ${fileName}`);
      res.json({ 
        success: true, 
        message: 'File đã được xóa thành công' 
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File không tồn tại'
      });
    }
  } catch (error) {
    console.error('❌ Delete achievement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi khi xóa file'
    });
  }
});

export default router;