import React, { useEffect, useState } from 'react';
import DataTableMember from '../components/DataTableMember.jsx';
import AuthService from '../../../firebase/lib/features/auth/authService.js';
import styles from './Members.module.css';

export default function Members() {
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    // Kiểm tra xem có payment status trong URL không
    const urlParams = new URLSearchParams(window.location.search);
    
    // PayOS trả về với format: ?code=00&status=PAID&orderCode=xxx
    const paymentStatus = urlParams.get('status');
    const orderCode = urlParams.get('orderCode');
    const cancelFlag = urlParams.get('cancel');
    const cancelled = urlParams.get('cancelled');
    const userId = urlParams.get('userId');
    const paymentSuccess = urlParams.get('paymentSuccess'); // From admin update package
    const paymentCancelled = urlParams.get('paymentCancelled'); // From admin update package
    
    console.log('🔍 URL params:', {
      paymentStatus,
      orderCode,
      cancelFlag,
      cancelled,
      userId,
      paymentSuccess,
      paymentCancelled,
      allParams: Object.fromEntries(urlParams)
    });

    // Kiểm tra thanh toán thành công: status=PAID hoặc payment=success hoặc paymentSuccess=true
    if (paymentStatus === 'PAID' || urlParams.get('payment') === 'success' || paymentSuccess === 'true') {
      console.log('✅ Phát hiện thanh toán thành công!');
      handlePaymentSuccess(userId, orderCode);
    } else if (cancelled === 'true' || cancelFlag === 'true' || urlParams.get('payment') === 'cancel' || paymentCancelled === 'true') {
      console.log('❌ Thanh toán bị hủy, đang xóa user...');
      handlePaymentCancel(userId);
    } else {
      console.log('ℹ️ Không có params thanh toán trong URL');
    }
  }, []);

  const handlePaymentSuccess = async (userId, orderCode) => {
    try {
      console.log('💰 Xử lý thanh toán thành công cho userId:', userId);
      console.log('📝 OrderCode:', orderCode);
      
      // Kiểm tra xem có phải là pending user mới không
      const pendingUserId = localStorage.getItem('pendingPaymentUserId');
      const isPendingUser = pendingUserId !== null;
      
      // 🔥 QUAN TRỌNG: Gọi confirm payment để update database
      // Vì webhook không hoạt động trên localhost
      if (orderCode) {
        console.log('🔄 Đang xác nhận thanh toán với backend...');
        try {
          const confirmResponse = await fetch('/api/payos/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderCode }),
          });
          
          const confirmData = await confirmResponse.json();
          console.log('✅ Confirm payment response:', confirmData);
          
          if (confirmData.success) {
            console.log('✅ Backend đã cập nhật gói tập thành công');
          } else {
            console.warn('⚠️ Confirm payment có vấn đề:', confirmData.message);
          }
        } catch (confirmError) {
          console.error('❌ Lỗi khi confirm payment:', confirmError);
          // Không throw error, vẫn tiếp tục hiển thị success
        }
      }
      
      if (isPendingUser) {
        // Trường hợp 1: Tạo user mới
        console.log('📝 Thanh toán cho user mới');
        localStorage.removeItem('pendingPaymentUserId');
        localStorage.removeItem('pendingPaymentOrderCode');
        localStorage.removeItem('pendingUserData');
        
        setPaymentStatus({ 
          success: true, 
          message: '✅ Thanh toán thành công! Hội viên mới đã được tạo trong hệ thống.' 
        });
      } else {
        // Trường hợp 2: Cập nhật gói tập cho user hiện có
        console.log('🔄 Thanh toán cập nhật gói tập cho user hiện có');
        
        setPaymentStatus({ 
          success: true, 
          message: '✅ Thanh toán thành công! Gói tập đã được cập nhật.' 
        });
      }
      
      // Xóa query params khỏi URL
      window.history.replaceState({}, '', '/admin/members');
      
      // Reload trang sau 2 giây để hiển thị dữ liệu mới
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Lỗi khi xử lý thanh toán:', error);
      setPaymentStatus({ 
        success: false, 
        message: '⚠️ Đã có lỗi xảy ra: ' + error.message 
      });
    }
  };

  const handlePaymentCancel = async (userId) => {
    try {
      console.log('🗑️ Xử lý hủy thanh toán, đang xóa user:', userId);
      
      // Lấy userId từ localStorage nếu không có trong URL
      const userIdToDelete = userId || localStorage.getItem('pendingPaymentUserId');
      
      if (userIdToDelete) {
        // Xóa user đã tạo vì payment bị cancel
        await AuthService.deleteSpendingUser(userIdToDelete);
        console.log('✅ Đã xóa spending user:', userIdToDelete);
      }
      
      // Xóa dữ liệu tạm
      localStorage.removeItem('pendingPaymentUserId');
      localStorage.removeItem('pendingPaymentOrderCode');
      localStorage.removeItem('pendingUserData'); // Xóa dữ liệu cũ nếu có
      
      setPaymentStatus({ 
        success: false, 
        message: '❌ Thanh toán đã bị hủy. Thông tin hội viên đã được xóa.' 
      });
      
      // Xóa query params
      window.history.replaceState({}, '', '/admin/members');
    } catch (error) {
      console.error('❌ Lỗi khi xử lý cancel:', error);
      setPaymentStatus({ 
        success: false, 
        message: '⚠️ Lỗi khi xóa thông tin: ' + error.message 
      });
    }
  };

  return (
    <div className={styles.membersPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>👥</span>
          Quản lý hội viên
        </h1>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => window.location.reload()}>
            <span>🔄</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Payment Status Alert */}
      {paymentStatus && (
        <div className={`${styles.alertBox} ${paymentStatus.success ? styles.alertSuccess : styles.alertError}`}>
          <span className={styles.alertIcon}>
            {paymentStatus.success ? '✅' : '❌'}
          </span>
          <span>{paymentStatus.message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.contentCard}>
        <DataTableMember />
      </div>
    </div>
  );
}
