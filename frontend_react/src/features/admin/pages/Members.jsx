import React, { useEffect, useState } from 'react';
import DataTableMember from '../components/DataTableMember.jsx';
import AuthService from '../../../firebase/lib/features/auth/authService.js';

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
    
    console.log('🔍 URL params:', {
      paymentStatus,
      orderCode,
      cancelFlag,
      cancelled,
      userId,
      allParams: Object.fromEntries(urlParams)
    });

    // Kiểm tra thanh toán thành công: status=PAID hoặc payment=success
    if (paymentStatus === 'PAID' || urlParams.get('payment') === 'success') {
      console.log('✅ Phát hiện thanh toán thành công!');
      handlePaymentSuccess(userId, orderCode);
    } else if (cancelled === 'true' || cancelFlag === 'true' || urlParams.get('payment') === 'cancel') {
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
      
      // 🔥 BƯỚC 1: Gọi API để xác nhận thanh toán và cập nhật users collection
      if (!orderCode) {
        // Lấy từ localStorage nếu không có trong URL
        orderCode = localStorage.getItem('pendingPaymentOrderCode');
      }
      
      if (orderCode) {
        console.log('🔄 Đang gọi API xác nhận thanh toán thủ công...');
        
        const response = await fetch('/api/payos/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderCode: Number(orderCode)
          })
        });
        
        const result = await response.json();
        console.log('📦 Kết quả xác nhận thanh toán:', result);
        
        if (!result.success) {
          throw new Error(result.message || 'Không thể xác nhận thanh toán');
        }
        
        console.log('✅ Đã cập nhật thông tin gói tập cho user trong collection users!');
      } else {
        console.warn('⚠️ Không tìm thấy orderCode để xác nhận thanh toán');
      }
      
      // BƯỚC 2: Xóa dữ liệu tạm
      localStorage.removeItem('pendingPaymentUserId');
      localStorage.removeItem('pendingPaymentOrderCode');
      localStorage.removeItem('pendingUserData');
      
      // BƯỚC 3: Hiển thị thông báo thành công
      setPaymentStatus({ 
        success: true, 
        message: '✅ Thanh toán thành công! Gói tập đã được kích hoạt cho hội viên.' 
      });
      
      // Xóa query params khỏi URL
      window.history.replaceState({}, '', '/admin/members');
      
      // Reload trang sau 2 giây để hiển thị user mới với gói tập
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

  // Dummy handlers for now
  const handleEdit = (user) => alert('Sửa: ' + user.full_name);
  const handleDisable = (user) => alert((user.membership_status === 'Active' ? 'Vô hiệu hóa: ' : 'Kích hoạt: ') + user.full_name);

  return (
    <div className="card">
      {paymentStatus && (
        <div 
          style={{
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '4px',
            backgroundColor: paymentStatus.success ? '#d4edda' : '#f8d7da',
            color: paymentStatus.success ? '#155724' : '#721c24',
            border: `1px solid ${paymentStatus.success ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {paymentStatus.message}
        </div>
      )}
      <DataTableMember onEdit={handleEdit} onDisable={handleDisable} />
    </div>
  );
}
