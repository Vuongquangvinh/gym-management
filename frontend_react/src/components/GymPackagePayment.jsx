// src/components/GymPackagePayment.jsx
import React, { useState } from 'react';
import { createGymPayment } from '../services/paymentService';
import { toast } from 'react-toastify';
import './GymPackagePayment.css';

/**
 * Component thanh toán gói tập gym
 * @param {Object} props
 * @param {Object} props.packageInfo - Thông tin gói tập {id, name, price, duration}
 * @param {Object} props.userInfo - Thông tin user {id, name, email, phone}
 * @param {Function} props.onSuccess - Callback khi thanh toán thành công
 * @param {Function} props.onError - Callback khi có lỗi
 */
function GymPackagePayment({ packageInfo, userInfo, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePaymentClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      const response = await createGymPayment({
        packageId: packageInfo.id || packageInfo.PackageId,
        packageName: packageInfo.name || packageInfo.PackageName,
        packagePrice: packageInfo.price || packageInfo.Price,
        packageDuration: packageInfo.duration || packageInfo.Duration,
        userId: userInfo.id || userInfo._id,
        userName: userInfo.name || userInfo.full_name,
        userEmail: userInfo.email,
        userPhone: userInfo.phone || userInfo.phone_number,
      });

      if (response.success && response.data.checkoutUrl) {
        toast.success('Đang chuyển đến trang thanh toán...');
        
        // Lưu thông tin vào localStorage để sử dụng sau
        localStorage.setItem('pendingPayment', JSON.stringify({
          orderCode: response.data.orderCode,
          packageInfo: packageInfo,
          createdAt: new Date().toISOString(),
        }));

        // Callback trước khi chuyển hướng
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Chuyển hướng đến trang thanh toán PayOS
        setTimeout(() => {
          window.location.href = response.data.checkoutUrl;
        }, 500);
      } else {
        throw new Error(response.message || 'Không thể tạo link thanh toán');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi thanh toán');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <>
      <div className="gym-package-payment">
        <div className="package-details">
          <h3 className="package-name">
            {packageInfo.name || packageInfo.PackageName}
          </h3>
          <div className="package-info">
            <div className="info-item">
              <span className="label">Giá:</span>
              <span className="value price">
                {formatPrice(packageInfo.price || packageInfo.Price)}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Thời hạn:</span>
              <span className="value">
                {packageInfo.duration || packageInfo.Duration} ngày
              </span>
            </div>
            {packageInfo.description || packageInfo.Description ? (
              <div className="info-item full-width">
                <span className="label">Mô tả:</span>
                <span className="value">
                  {packageInfo.description || packageInfo.Description}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <button
          className="btn-payment"
          onClick={handlePaymentClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Đang xử lý...
            </>
          ) : (
            <>
              <span className="icon">💳</span>
              Thanh toán ngay
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="payment-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận thanh toán</h3>
              <button
                className="close-btn"
                onClick={() => setShowConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn thanh toán gói tập:</p>
              <div className="confirm-details">
                <p><strong>{packageInfo.name || packageInfo.PackageName}</strong></p>
                <p>Giá: <strong>{formatPrice(packageInfo.price || packageInfo.Price)}</strong></p>
                <p>Thời hạn: <strong>{packageInfo.duration || packageInfo.Duration} ngày</strong></p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GymPackagePayment;
