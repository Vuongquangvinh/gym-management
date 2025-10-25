import React, { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ 
  currentImage = null, 
  onImageChange, 
  onImageClick = null,
  width = 200, 
  height = 250, 
  acceptedFormats = "image/jpeg,image/jpg,image/png",
  maxSizeKB = 500 
}) => {
  const [preview, setPreview] = useState(currentImage);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Update preview when currentImage prop changes
  useEffect(() => {
    console.log('🔄 ImageUpload currentImage changed:', currentImage);
    setPreview(currentImage);
  }, [currentImage]);

  // Validate file
  const validateFile = (file) => {
    const maxSize = maxSizeKB * 1024; // Convert KB to bytes
    const allowedTypes = acceptedFormats.split(',');
    
    if (!allowedTypes.includes(file.type)) {
      return `Chỉ hỗ trợ định dạng: ${acceptedFormats}`;
    }
    
    if (file.size > maxSize) {
      return `Kích thước file không được vượt quá ${maxSizeKB}KB`;
    }
    
    return null;
  };

  // Resize image to specified dimensions
  const resizeImage = (file, targetWidth, targetHeight) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Draw scaled image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    setError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Resize image
      const resizedBlob = await resizeImage(file, width, height);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      // Create preview
      const previewUrl = URL.createObjectURL(resizedFile);
      setPreview(previewUrl);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = 'jpg'; // Always save as JPG after resize
      const fileName = `emp_${timestamp}_${randomString}.${extension}`;
      
      // Call parent callback
      onImageChange({
        file: resizedFile,
        fileName: fileName,
        url: `/uploads/employees/avatars/${fileName}`,
        preview: previewUrl
      });
      
    } catch (err) {
      setError('Có lỗi khi xử lý ảnh');
      console.error('Image processing error:', err);
    }
  };

  // File input change handler
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove image
  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange(null);
  };

  return (
    <div className="image-upload-container">
      <div 
        className={`image-upload-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-image' : ''}`}
        style={{ width: width, height: height }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="image-preview">
            <img 
              src={preview} 
              alt="Preview"
              onClick={onImageClick ? (e) => {
                e.stopPropagation();
                onImageClick();
              } : undefined}
              style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            />
            <div className="image-overlay">
              {onImageClick && (
                <button 
                  type="button"
                  className="btn-zoom"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick();
                  }}
                  title="Xem phóng to"
                >
                  🔍
                </button>
              )}
              <button 
                type="button"
                className="btn-remove" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                ✕
              </button>
              <button 
                type="button"
                className="btn-change"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                📷
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <p>Kéo thả ảnh vào đây</p>
            <p>hoặc click để chọn</p>
            <small>{width}x{height}px • Tối đa {maxSizeKB}KB</small>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      
      {error && (
        <div className="upload-error">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;