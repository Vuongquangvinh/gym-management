import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import './PTFaceRegistrationModal.css';

const PTFaceRegistrationModal = ({ isOpen, onClose, employee, onRegistrationSuccess }) => {
  const [step, setStep] = useState(1); // 1: Instructions, 2: Camera, 3: Preview
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen && step === 2) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setStep(3);
        stopCamera();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  };

  const processRegistration = async () => {
    if (!capturedImage || !employee) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert image URL to base64
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Call Python backend API
      const result = await fetch(`${API_BASE_URL}/api/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee._id,
          employeeName: employee.fullName,
          imageBase64: base64
        })
      });

      const data = await result.json();

      if (result.ok && data.success) {
        // Close modal
        onClose();
        // Reset state
        setStep(1);
        setCapturedImage(null);
        setError(null);
        
        // Call success callback
        if (onRegistrationSuccess) {
          setTimeout(() => {
            onRegistrationSuccess();
          }, 100);
        }
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          html: `
            <p>Đăng ký Face ID thành công!</p>
            <p style="margin-top: 12px; font-size: 14px; color: #666;">
              Bạn có thể sử dụng Face ID để check-in/check-out từ bây giờ.
            </p>
          `,
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#007bff',
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        const errorMsg = data?.message || 'Đăng ký thất bại';
        throw new Error(errorMsg);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt. Vui lòng thử lại.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#007bff'
      });
      
      setError(err.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep(2);
    setError(null);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    setStep(1);
    setCapturedImage(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="pt-face-registration-modal-overlay">
      <div className="pt-face-registration-modal">
        <div className="pt-modal-header">
          <h2>📷 Đăng ký Face ID</h2>
          <button className="pt-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="pt-modal-content">
          {step === 1 && (
            <div className="pt-registration-step pt-instructions">
              <div className="pt-step-icon">📋</div>
              <h3>Hướng dẫn đăng ký Face ID</h3>
              <div className="pt-instructions-list">
                <div className="pt-instruction-item">
                  <span className="pt-instruction-number">1</span>
                  <p>Đảm bảo ánh sáng đủ và khuôn mặt rõ ràng</p>
                </div>
                <div className="pt-instruction-item">
                  <span className="pt-instruction-number">2</span>
                  <p>Nhìn thẳng vào camera, không đeo kính râm</p>
                </div>
                <div className="pt-instruction-item">
                  <span className="pt-instruction-number">3</span>
                  <p>Giữ nguyên tư thế khi chụp ảnh</p>
                </div>
                <div className="pt-instruction-item">
                  <span className="pt-instruction-number">4</span>
                  <p>Chỉ có một người trong khung hình</p>
                </div>
              </div>
              
              {employee && (
                <div className="pt-employee-info">
                  <h4>Nhân viên: {employee.fullName}</h4>
                  <p>Vị trí: {employee.position}</p>
                </div>
              )}

              <button 
                className="pt-btn-start-camera"
                onClick={() => setStep(2)}
              >
                📷 Bắt đầu chụp ảnh
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="pt-registration-step pt-camera">
              <div className="pt-camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="pt-camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="pt-camera-overlay">
                  <div className="pt-face-guide">
                    <div className="pt-guide-circle"></div>
                    <p>Đặt khuôn mặt trong vòng tròn</p>
                  </div>
                </div>
              </div>

              <div className="pt-camera-controls">
                <button 
                  className="pt-btn-capture"
                  onClick={capturePhoto}
                  disabled={isCapturing}
                >
                  {isCapturing ? '📸 Đang chụp...' : '📸 Chụp ảnh'}
                </button>
                <button 
                  className="pt-btn-cancel"
                  onClick={handleClose}
                >
                  ❌ Hủy
                </button>
              </div>

              {error && (
                <div className="pt-error-message">
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="pt-registration-step pt-preview">
              <div className="pt-step-icon">🖼️</div>
              <h3>Xem trước ảnh</h3>
              
              {capturedImage && (
                <div className="pt-image-preview">
                  <img src={capturedImage} alt="Captured face" />
                </div>
              )}

              <div className="pt-preview-actions">
                <button 
                  className="pt-btn-retake"
                  onClick={retakePhoto}
                  disabled={isProcessing}
                >
                  🔄 Chụp lại
                </button>
                <button 
                  className="pt-btn-confirm"
                  onClick={processRegistration}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Đang xử lý...' : '✅ Xác nhận đăng ký'}
                </button>
              </div>

              {error && (
                <div className="pt-error-message">
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PTFaceRegistrationModal;



