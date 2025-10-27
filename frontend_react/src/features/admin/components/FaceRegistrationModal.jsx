import React, { useState, useRef, useEffect } from 'react';
import './FaceRegistrationModal.css';

const FaceRegistrationModal = ({ isOpen, onClose, employee, onRegistrationSuccess }) => {
  const [step, setStep] = useState(1); // 1: Instructions, 2: Camera, 3: Success
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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
      console.error('Error accessing camera:', err);
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

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
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
    console.log('🔘 processRegistration called!');
    console.log('capturedImage:', capturedImage);
    console.log('employee:', employee);
    
    if (!capturedImage || !employee) {
      console.error('❌ Missing capturedImage or employee!');
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

      console.log('📤 Sending face registration request...');
      
      // Use the correct API URL
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

      console.log('📥 Response status:', result.status);
      
      const data = await result.json();
      console.log('📥 Response data:', data);

      if (result.ok && data.success) {
        setSuccess(true);
        console.log('✅ Registration successful!');
        
        // Call success callback to refresh data
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
        
        // Update employee data in local state if needed
        setTimeout(() => {
          onClose();
          // Reset modal state
          setStep(1);
          setCapturedImage(null);
          setSuccess(false);
          setError(null);
        }, 2000);
      } else {
        const errorMsg = data?.message || 'Đăng ký thất bại';
        console.error('❌ Registration failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Có lỗi xảy ra khi đăng ký khuôn mặt. Vui lòng thử lại.');
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
    // Reset state
    setStep(1);
    setCapturedImage(null);
    setSuccess(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="face-registration-modal-overlay">
      <div className="face-registration-modal">
        <div className="modal-header">
          <h2>📷 Đăng ký Face ID</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="registration-step instructions">
              <div className="step-icon">📋</div>
              <h3>Hướng dẫn đăng ký Face ID</h3>
              <div className="instructions-list">
                <div className="instruction-item">
                  <span className="instruction-number">1</span>
                  <p>Đảm bảo ánh sáng đủ và khuôn mặt rõ ràng</p>
                </div>
                <div className="instruction-item">
                  <span className="instruction-number">2</span>
                  <p>Nhìn thẳng vào camera, không đeo kính râm</p>
                </div>
                <div className="instruction-item">
                  <span className="instruction-number">3</span>
                  <p>Giữ nguyên tư thế khi chụp ảnh</p>
                </div>
                <div className="instruction-item">
                  <span className="instruction-number">4</span>
                  <p>Chỉ có một người trong khung hình</p>
                </div>
              </div>
              
              {employee && (
                <div className="employee-info">
                  <h4>Nhân viên: {employee.fullName}</h4>
                  <p>Vị trí: {employee.position}</p>
                </div>
              )}

              <button 
                className="btn-start-camera"
                onClick={() => setStep(2)}
              >
                📷 Bắt đầu chụp ảnh
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="registration-step camera">
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="camera-overlay">
                  <div className="face-guide">
                    <div className="guide-circle"></div>
                    <p>Đặt khuôn mặt trong vòng tròn</p>
                  </div>
                </div>
              </div>

              <div className="camera-controls">
                <button 
                  className="btn-capture"
                  onClick={capturePhoto}
                  disabled={isCapturing}
                >
                  {isCapturing ? '📸 Đang chụp...' : '📸 Chụp ảnh'}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={handleClose}
                >
                  ❌ Hủy
                </button>
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="registration-step preview">
              <div className="step-icon">🖼️</div>
              <h3>Xem trước ảnh</h3>
              
              {capturedImage && (
                <div className="image-preview">
                  <img src={capturedImage} alt="Captured face" />
                </div>
              )}

              <div className="preview-actions">
                <button 
                  className="btn-retake"
                  onClick={() => {
                    console.log('🔄 Retake button clicked');
                    retakePhoto();
                  }}
                  disabled={isProcessing}
                >
                  🔄 Chụp lại
                </button>
                <button 
                  className="btn-confirm"
                  onClick={(e) => {
                    console.log('✅ Confirm button clicked!', e);
                    console.log('Button disabled?', isProcessing);
                    processRegistration();
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Đang xử lý...' : '✅ Xác nhận đăng ký'}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              {success && (
                <div className="success-message">
                  ✅ Đăng ký Face ID thành công!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRegistrationModal;