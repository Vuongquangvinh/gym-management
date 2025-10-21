import React, { useEffect, useState } from 'react';
import DataTableMember from '../components/DataTableMember.jsx';
import AuthService from '../../../firebase/lib/features/auth/authService.js';

export default function Members() {
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    // Kiểm tra xem có payment status trong URL không
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');

    if (payment === 'success') {
      handlePaymentSuccess();
    } else if (payment === 'cancel') {
      handlePaymentCancel();
    }
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Lấy thông tin user đang chờ từ localStorage
      const pendingUserDataStr = localStorage.getItem('pendingUserData');
      
      if (!pendingUserDataStr) {
        console.error('Không tìm thấy thông tin user đang chờ');
        setPaymentStatus({ success: false, message: 'Không tìm thấy thông tin thanh toán' });
        return;
      }

      const pendingUserData = JSON.parse(pendingUserDataStr);
      
      // Loại bỏ các trường không thuộc schema của SpendingUser
      const {
        package_name: _package_name,
        package_price: _package_price,
        package_duration: _package_duration,
        orderCode: _orderCode,
        paymentLinkId: _paymentLinkId,
        ...validUserData
      } = pendingUserData;
      
      // Tạo user trong database với dữ liệu hợp lệ
      const newUser = await AuthService.createUserByAdmin(validUserData);
      console.log('✅ User đã được tạo sau thanh toán thành công:', newUser);
      
      // Xóa dữ liệu tạm khỏi localStorage
      localStorage.removeItem('pendingUserData');
      
      // Hiển thị thông báo thành công
      setPaymentStatus({ success: true, message: 'Thanh toán thành công! Hội viên đã được tạo.' });
      
      // Xóa query params khỏi URL
      window.history.replaceState({}, '', '/admin/members');
      
      // Reload trang sau 2 giây để hiển thị user mới
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Lỗi khi tạo user sau thanh toán:', error);
      setPaymentStatus({ success: false, message: 'Thanh toán thành công nhưng có lỗi khi tạo hội viên: ' + error.message });
    }
  };

  const handlePaymentCancel = () => {
    // Xóa dữ liệu tạm
    localStorage.removeItem('pendingUserData');
    setPaymentStatus({ success: false, message: 'Thanh toán đã bị hủy' });
    
    // Xóa query params
    window.history.replaceState({}, '', '/admin/members');
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
