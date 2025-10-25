import React, { useState, useEffect } from 'react';

const EmployeeAvatar = ({ src, alt, className, style, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (src && src.trim() !== '') {
      // Convert relative paths to backend URLs
      const imageUrl = src.startsWith('http') 
        ? src 
        : `http://localhost:3000${src}`;
      setImageSrc(imageUrl);
    } else {
      setImageSrc('');
    }
  }, [src]);

  const handleImageError = (e) => {
    setImageError(true);
    if (onError) {
      onError(e);
    }
  };

  // Don't render if no valid src or if there's an error
  if (!imageSrc || imageSrc === '' || (imageError && !imageSrc)) {
    return (
      <div 
        className={className} 
        style={{ 
          ...style, 
          backgroundColor: '#f0f0f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#999',
          fontSize: '12px'
        }}
      >
        No Image
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      {...props}
    />
  );
};

export default EmployeeAvatar;