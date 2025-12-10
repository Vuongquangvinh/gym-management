import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './FaceRegistrationModal.module.css';

const FaceCheckinModal = ({ isOpen, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedEmployee, setDetectedEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [scanningMessage, setScanningMessage] = useState('Đang quét khuôn mặt...');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Đảm bảo dừng hoàn toàn khi đóng modal
      stopCamera();
      resetState();
    }
    return () => {
      stopCamera();
      resetState();
    };
  }, [isOpen]);

  const resetState = () => {
    setIsScanning(false);
    setDetectedEmployee(null);
    setError(null);
    setSuccess(false);
    setCheckinResult(null);
    setScanningMessage('Đang quét khuôn mặt...');
    isScanningRef.current = false;
    isProcessingRef.current = false;
  };

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
    console.log('🛑 Stopping camera and face detection...');
    
    // Dừng ngay lập tức việc quét
    isScanningRef.current = false;
    isProcessingRef.current = false;
    setIsScanning(false);
    
    // Abort any ongoing fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('✅ Aborted ongoing requests');
    }
    
    // Clear interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      console.log('✅ Cleared scan interval');
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('✅ Stopped camera stream');
    }
  };

  const startFaceDetection = () => {
    console.log('🚀 Starting face detection interval...');
    
    // Clear any existing interval first
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Simulate face detection every 2 seconds
    scanIntervalRef.current = setInterval(async () => {
      // Check if we should still be scanning
      if (!isScanningRef.current || isProcessingRef.current || !isOpen) {
        console.log('⏸️ Skipping scan - scanning:', isScanningRef.current, 'processing:', isProcessingRef.current, 'modal open:', isOpen);
        return;
      }

      try {
        console.log('📸 Capturing frame for face detection...');
        
        // Mark as processing to prevent overlapping requests
        isProcessingRef.current = true;
        
        // Capture frame for detection
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
          console.log('⚠️ Video or canvas ref not available');
          isProcessingRef.current = false;
          return;
        }
        
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Use the correct API URL
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        console.log('🌐 Sending request to /api/face/recognize...');

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        // Call face recognition API with abort signal
        const response = await fetch(`${API_BASE_URL}/api/face/recognize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: imageBase64
          }),
          signal: abortControllerRef.current.signal
        });

        console.log('📡 Response status:', response.status, response.ok);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📦 Response data:', result);
          
          if (result.success && result.employee) {
            console.log('✅ Face detected:', result.employee);
            
            // Prevent duplicate processing if already detected
            if (detectedEmployee) {
              console.log('⚠️ Already have detected employee, skipping');
              return;
            }
            
            // Show success notification
            toast.success(`✅ Nhận diện thành công: ${result.employee.fullName}`, {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            
            // Update scanning message
            setScanningMessage(`✅ Đã nhận diện: ${result.employee.fullName}`);
            
            setDetectedEmployee(result.employee);
            setIsScanning(false);
            isScanningRef.current = false;
            isProcessingRef.current = false; // Reset so buttons work
            stopCamera();
            
            console.log('✅ State updated - detectedEmployee:', result.employee.fullName);
          } else {
            console.log('⚠️ No employee detected or success=false:', result);
            isProcessingRef.current = false; // Reset for next attempt
          }
        } else {
          console.log('❌ Response not OK:', response.status);
          isProcessingRef.current = false; // Reset for next attempt
        }
      } catch (err) {
        // Ignore AbortError when request is cancelled
        if (err.name === 'AbortError') {
          console.log('🚫 Request aborted');
          return;
        }
        
        // Log other errors but continue scanning
        console.error('❌ Error during face detection:', err);
        isProcessingRef.current = false; // Reset on error
      }
    }, 2000);
  };

  const processCheckin = async (checkinType = 'checkin') => {
    if (!detectedEmployee) {
      console.log('⚠️ No detected employee');
      return;
    }

    console.log(`🚀 Processing ${checkinType} for employee:`, detectedEmployee._id);
    
    setIsProcessing(true);
    isProcessingRef.current = true;
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const requestBody = {
        employeeId: detectedEmployee._id,
        checkinType: checkinType,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending checkin request:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/face/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Checkin response status:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Checkin successful:', result);
        setCheckinResult(result.data || result); // Use result.data if available
        setSuccess(true);
        
        // Auto close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.detail || errorData?.message || 'Thất bại';
        
        console.log('❌ Checkin failed:', response.status, errorMessage, errorData);
        
        // Special handling for schedule-related errors
        if (errorMessage.includes('không có lịch làm việc') || errorMessage.includes('lịch làm việc')) {
          setError(`❌ ${errorMessage}\n\n💡 Vui lòng liên hệ quản lý để được xếp lịch làm việc.`);
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('❌ Checkin exception:', err);
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
    setScanningMessage('Đang quét khuôn mặt...');
    startCamera();
  };

  const handleClose = () => {
    console.log('🚪 Closing modal...');
    
    // Stop camera and scanning first
    stopCamera();
    
    // Reset all state
    resetState();
    
    // Close modal
    onClose();
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
                <h3>🔍 {scanningMessage}</h3>
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
              <h3>{checkinResult.checkinType === 'checkout' ? 'Checkout' : 'Check-in'} thành công!</h3>
              
              <div className={styles.checkinSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Nhân viên:</span>
                  <span className={styles.summaryValue}>{checkinResult.employeeName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Thời gian:</span>
                  <span className={styles.summaryValue}>
                    {(() => {
                      try {
                        const timestamp = checkinResult.timestamp;
                        const date = new Date(timestamp);
                        if (isNaN(date.getTime())) {
                          return new Date().toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });
                        }
                        return date.toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });
                      } catch (e) {
                        return new Date().toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });
                      }
                    })()}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Ngày:</span>
                  <span className={styles.summaryValue}>
                    {(() => {
                      try {
                        const dateStr = checkinResult.date;
                        if (!dateStr) return new Date().toLocaleDateString('vi-VN');
                        
                        // If already in DD/MM/YYYY format
                        if (dateStr.includes('/')) return dateStr;
                        
                        // If in YYYY-MM-DD format
                        const [year, month, day] = dateStr.split('-');
                        return `${day}/${month}/${year}`;
                      } catch (e) {
                        return new Date().toLocaleDateString('vi-VN');
                      }
                    })()}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Phương thức:</span>
                  <span className={styles.summaryValue}>Face Recognition ✨</span>
                </div>
              </div>

              <div className={styles.successMessage}>
                ✅ {checkinResult.checkinType === 'checkout' ? 'Checkout' : 'Check-in'} đã được ghi nhận trong hệ thống
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceCheckinModal;
