import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import styles from './FaceRegistrationModal.module.css';

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

      const data = await result.json();

      if (result.ok && data.success) {
        // Close modal first
        onClose();
        // Reset modal state
        setStep(1);
        setCapturedImage(null);
        setSuccess(false);
        setError(null);
        
        // Call success callback to refresh data after modal closes
        if (onRegistrationSuccess) {
          setTimeout(() => {
            onRegistrationSuccess();
          }, 100);
        }
        
        // Show success message with SweetAlert2
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đăng ký Face ID thành công!',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        const errorMsg = data?.message || 'Đăng ký thất bại';
        throw new Error(errorMsg);
      }
    } catch (err) {
      // Show error with SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt. Vui lòng thử lại.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#1976d2'
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
    // Reset state
    setStep(1);
    setCapturedImage(null);
    setSuccess(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.faceRegistrationModalOverlay}>
      <div className={styles.faceRegistrationModal}>
        <div className={styles.modalHeader}>
          <h2>📷 Đăng ký Face ID</h2>
          <button className={styles.closeBtn} onClick={handleClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          {step === 1 && (
            <div className={styles.registrationStep}>
              <div className={styles.stepIcon}>📋</div>
              <h3>Hướng dẫn đăng ký Face ID</h3>
              <div className={styles.instructionsList}>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNumber}>1</span>
                  <p>Đảm bảo ánh sáng đủ và khuôn mặt rõ ràng</p>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNumber}>2</span>
                  <p>Nhìn thẳng vào camera, không đeo kính râm</p>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNumber}>3</span>
                  <p>Giữ nguyên tư thế khi chụp ảnh</p>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.instructionNumber}>4</span>
                  <p>Chỉ có một người trong khung hình</p>
                </div>
              </div>
              
              {employee && (
                <div className={styles.employeeInfo}>
                  <h4>Nhân viên: {employee.fullName}</h4>
                  <p>Vị trí: {employee.position}</p>
                </div>
              )}

              <button 
                className={styles.btnStartCamera}
                onClick={() => setStep(2)}
              >
                📷 Bắt đầu chụp ảnh
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.registrationStep}>
              <div className={styles.cameraContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.cameraVideo}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className={styles.cameraOverlay}>
                  <div className={styles.faceGuide}>
                    <div className={styles.guideCircle}></div>
                    <p>Đặt khuôn mặt trong vòng tròn</p>
                  </div>
                </div>
              </div>

              <div className={styles.cameraControls}>
                <button 
                  className={styles.btnCapture}
                  onClick={capturePhoto}
                  disabled={isCapturing}
                >
                  {isCapturing ? '📸 Đang chụp...' : '📸 Chụp ảnh'}
                </button>
                <button 
                  className={styles.btnCancel}
                  onClick={handleClose}
                >
                  ❌ Hủy
                </button>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className={styles.registrationStep}>
              <div className={styles.stepIcon}>🖼️</div>
              <h3>Xem trước ảnh</h3>
              
              {capturedImage && (
                <div className={styles.imagePreview}>
                  <img src={capturedImage} alt="Captured face" />
                </div>
              )}

              <div className={styles.previewActions}>
                <button 
                  className={styles.btnRetake}
                  onClick={retakePhoto}
                  disabled={isProcessing}
                >
                  🔄 Chụp lại
                </button>
                <button 
                  className={styles.btnConfirm}
                  onClick={processRegistration}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Đang xử lý...' : '✅ Xác nhận đăng ký'}
                </button>
              </div>

              {error && (
                <div className={styles.errorMessage}>
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

export default FaceRegistrationModal;
