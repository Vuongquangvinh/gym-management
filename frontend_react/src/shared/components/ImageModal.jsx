import React from 'react';
import './ImageModal.css';

export function ImageModal({ isOpen, onClose, imageUrl, title }) {
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleZoomIn = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setZoom(prev => Math.min(prev * 1.3, 10));
  }, []);

  const handleZoomOut = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setZoom(prev => Math.max(prev / 1.3, 0.3));
  }, []);

  const handleResetZoom = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleOverlayClick = React.useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '+' || e.key === '=') {
      handleZoomIn();
    } else if (e.key === '-') {
      handleZoomOut();
    } else if (e.key === '0') {
      handleResetZoom();
    }
  }, [onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  const handleMouseDown = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = React.useCallback((e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY > 0) {
      handleZoomOut();
    } else {
      handleZoomIn();
    }
  }, [handleZoomIn, handleZoomOut]);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset zoom khi mở modal mới
  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Không render gì nếu modal không mở
  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={handleOverlayClick}>
      <div className="image-modal-container">
        <div className="image-modal-header">
          <h3>{title || 'Xem ảnh'}</h3>
          <div className="zoom-controls">
            <button 
              className="zoom-btn"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              type="button"
            >
              🔍−
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              className="zoom-btn"
              onClick={handleZoomIn}
              title="Zoom In (+)"
              type="button"
            >
              🔍+
            </button>
            <button 
              className="zoom-btn reset-btn"
              onClick={handleResetZoom}
              title="Reset Zoom (0)"
              type="button"
            >
              ↻
            </button>
          </div>
          <button 
            className="image-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            <span>✕</span>
          </button>
        </div>
        <div 
          className="image-modal-content"
          onWheel={handleWheel}
          onClick={(e) => e.stopPropagation()}
        >
          <img 
            src={imageUrl} 
            alt={title || 'Ảnh phóng to'}
            className="image-modal-image"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
        <div className="image-modal-footer">
          <p className="image-modal-tip">
            ESC: Đóng | Scroll/+/-: Zoom (30%-1000%) | Kéo thả: Di chuyển | 0: Reset
          </p>
        </div>
      </div>
    </div>
  );
}