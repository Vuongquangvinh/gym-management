import React, { useState, useRef, useEffect } from 'react';
import styles from './FaceRegistrationModal.module.css';

const FaceCheckinModal = ({ isOpen, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedEmployee, setDetectedEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

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
      setIsScanning(true);
      isScanningRef.current = true;
      startFaceDetection();
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startFaceDetection = () => {
    // Simulate face detection every 2 seconds
    scanIntervalRef.current = setInterval(async () => {
      if (!isScanningRef.current || isProcessingRef.current) {
        return;
      }

      try {
        // Capture frame for detection
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Use the correct API URL
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Call face recognition API
        const response = await fetch(`${API_BASE_URL}/api/face/recognize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: imageBase64
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.employee) {
            setDetectedEmployee(result.employee);
            setIsScanning(false);
            isScanningRef.current = false;
            stopCamera();
          }
        }
      } catch (err) {
        // Continue scanning on error
      }
    }, 2000);
  };

  const processCheckin = async (checkinType = 'checkin') => {
    if (!detectedEmployee) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_BASE_URL}/api/face/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: detectedEmployee._id,
          checkinType: checkinType,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCheckinResult(result);
        setSuccess(true);
        
        // Auto close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.detail || errorData?.message || 'Thất bại';
        
        // Special handling for schedule-related errors
        if (errorMessage.includes('không có lịch làm việc') || errorMessage.includes('lịch làm việc')) {
          setError(`❌ ${errorMessage}\n\n💡 Vui lòng liên hệ quản lý để được xếp lịch làm việc.`);
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi thực hiện. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleCheckin = () => processCheckin('checkin');
  const handleCheckout = () => processCheckin('checkout');

  const retryScanning = () => {
    setDetectedEmployee(null);
    setError(null);
    setSuccess(false);
    setCheckinResult(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    // Reset state
    setDetectedEmployee(null);
    setError(null);
    setSuccess(false);
    setCheckinResult(null);
    setIsScanning(false);
    setIsProcessing(false);
    isScanningRef.current = false;
    isProcessingRef.current = false;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.faceRegistrationModalOverlay}>
      <div className={styles.faceRegistrationModal}>
        <div className={styles.modalHeader}>
          <h2>📷 Face Check-in</h2>
          <button className={styles.closeBtn} onClick={handleClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          {!detectedEmployee && !success && (
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
                    <div className={styles.faceFrame}>
                      <div className={styles.faceBorder}>
                        <div className={styles.corner}></div>
                        <div className={styles.corner}></div>
                        <div className={styles.corner}></div>
                        <div className={styles.corner}></div>
                      </div>
                    </div>
                    <p>Đặt khuôn mặt trong khung để nhận diện</p>
                    {isScanning && (
                      <div className={styles.scanningIndicator}>
                        <div className={styles.scanLine}></div>
                        <span>Đang quét...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.scanningStatus}>
                <h3>🔍 Đang quét khuôn mặt...</h3>
                <p>Vui lòng nhìn thẳng vào camera và giữ nguyên tư thế</p>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  ❌ {error}
                </div>
              )}

              <button 
                className={styles.btnCancel}
                onClick={handleClose}
              >
                ❌ Hủy quét
              </button>
            </div>
          )}

          {detectedEmployee && !success && (
            <div className={styles.registrationStep}>
              <div className={styles.successIcon}>✅</div>
              <h3>Đã nhận diện thành công!</h3>
              
              <div className={styles.detectedEmployee}>
                <div className={styles.employeeAvatar}>
                  {detectedEmployee.avatarUrl ? (
                    <img src={detectedEmployee.avatarUrl} alt={detectedEmployee.fullName} />
                  ) : (
                    <span>{detectedEmployee.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.employeeDetails}>
                  <h4>{detectedEmployee.fullName}</h4>
                  <p>Vị trí: {detectedEmployee.position}</p>
                  <p>ID: {detectedEmployee._id.slice(-6)}</p>
                </div>
              </div>

              <div className={styles.checkinActions}>
                <button 
                  className={styles.btnRetake}
                  onClick={retryScanning}
                  disabled={isProcessing}
                >
                  🔄 Quét lại
                </button>
                <div className={styles.checkinButtons}>
                  <button 
                    className={styles.btnCheckin}
                    onClick={handleCheckin}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Đang xử lý...' : '✅ Check-in'}
                  </button>
                  <button 
                    className={styles.btnCheckout}
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Đang xử lý...' : '🚪 Checkout'}
                  </button>
                </div>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {success && checkinResult && (
            <div className={styles.registrationStep}>
              <div className={styles.successIcon}>🎉</div>
              <h3>Check-in thành công!</h3>
              
              <div className={styles.checkinSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Nhân viên:</span>
                  <span className={styles.summaryValue}>{checkinResult.employeeName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Thời gian:</span>
                  <span className={styles.summaryValue}>{new Date(checkinResult.timestamp).toLocaleString('vi-VN')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Phương thức:</span>
                  <span className={styles.summaryValue}>Face Recognition</span>
                </div>
              </div>

              <div className={styles.successMessage}>
                ✅ Check-in đã được ghi nhận trong hệ thống
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceCheckinModal;
