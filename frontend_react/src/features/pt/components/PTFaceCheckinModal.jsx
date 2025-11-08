import React, { useState, useRef, useEffect } from 'react';
import './PTFaceCheckinModal.css';

const PTFaceCheckinModal = ({ isOpen, onClose, onCheckinSuccess }) => {
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
    scanIntervalRef.current = setInterval(async () => {
      if (!isScanningRef.current || isProcessingRef.current) {
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
        setCheckinResult(result.data);
        setSuccess(true);
        
        // Call success callback
        if (onCheckinSuccess) {
          onCheckinSuccess(result.data);
        }
        
        // Auto close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.detail || errorData?.message || 'Thất bại';
        
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
    <div className="pt-face-checkin-modal-overlay">
      <div className="pt-face-checkin-modal">
        <div className="pt-modal-header">
          <h2>📷 Face Check-in</h2>
          <button className="pt-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="pt-modal-content">
          {!detectedEmployee && !success && (
            <div className="pt-checkin-step pt-scanning">
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
                  <div className="pt-scan-guide">
                    <div className="pt-scan-frame">
                      <div className="pt-scan-corners">
                        <div className="pt-corner pt-top-left"></div>
                        <div className="pt-corner pt-top-right"></div>
                        <div className="pt-corner pt-bottom-left"></div>
                        <div className="pt-corner pt-bottom-right"></div>
                      </div>
                    </div>
                    <p>Đặt khuôn mặt trong khung để nhận diện</p>
                    {isScanning && (
                      <div className="pt-scanning-indicator">
                        <div className="pt-scan-line"></div>
                        <span>Đang quét...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-scanning-info">
                <h3>🔍 Đang quét khuôn mặt...</h3>
                <p>Vui lòng nhìn thẳng vào camera và giữ nguyên tư thế</p>
              </div>

              {error && (
                <div className="pt-error-message">
                  {error}
                </div>
              )}

              <button 
                className="pt-btn-cancel-scan"
                onClick={handleClose}
              >
                ❌ Hủy quét
              </button>
            </div>
          )}

          {detectedEmployee && !success && (
            <div className="pt-checkin-step pt-detected">
              <div className="pt-step-icon">✅</div>
              <h3>Đã nhận diện thành công!</h3>
              
              <div className="pt-employee-card">
                <div className="pt-employee-avatar">
                  {detectedEmployee.avatarUrl ? (
                    <img src={detectedEmployee.avatarUrl} alt={detectedEmployee.fullName} />
                  ) : (
                    <span>{detectedEmployee.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="pt-employee-details">
                  <h4>{detectedEmployee.fullName}</h4>
                  <p>Vị trí: {detectedEmployee.position}</p>
                  <p className="pt-confidence">Độ chính xác: {detectedEmployee.confidence}%</p>
                </div>
              </div>

              <div className="pt-detected-actions">
                <button 
                  className="pt-btn-retry-scan"
                  onClick={retryScanning}
                  disabled={isProcessing}
                >
                  🔄 Quét lại
                </button>
                <div className="pt-checkin-checkout-buttons">
                  <button 
                    className="pt-btn-checkin"
                    onClick={handleCheckin}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Đang xử lý...' : '✅ Check-in'}
                  </button>
                  <button 
                    className="pt-btn-checkout"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Đang xử lý...' : '🚪 Checkout'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="pt-error-message">
                  {error}
                </div>
              )}
            </div>
          )}

          {success && checkinResult && (
            <div className="pt-checkin-step pt-success">
              <div className="pt-step-icon">🎉</div>
              <h3>{checkinResult.checkinType === 'checkin' ? 'Check-in' : 'Checkout'} thành công!</h3>
              
              <div className="pt-checkin-result">
                <div className="pt-result-item">
                  <span className="pt-label">Nhân viên:</span>
                  <span className="pt-value">{checkinResult.employeeName}</span>
                </div>
                <div className="pt-result-item">
                  <span className="pt-label">Thời gian:</span>
                  <span className="pt-value">
                    {new Date(checkinResult.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="pt-result-item">
                  <span className="pt-label">Ngày:</span>
                  <span className="pt-value">{checkinResult.date}</span>
                </div>
                <div className="pt-result-item">
                  <span className="pt-label">Phương thức:</span>
                  <span className="pt-value">Face Recognition ✨</span>
                </div>
              </div>

              <div className="pt-success-message">
                ✅ {checkinResult.checkinType === 'checkin' ? 'Check-in' : 'Checkout'} đã được ghi nhận
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PTFaceCheckinModal;



