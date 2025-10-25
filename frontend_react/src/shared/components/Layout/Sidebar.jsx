import React, { useState } from 'react';
import AddNewUser from '../../../features/admin/components/AddNewUser.jsx';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import '../../../features/admin/admin.css';
import AuthService from '../../../firebase/lib/features/auth/authService.js';
// small inline SVG icons to avoid adding deps
const Icon = ({ name }) => {
  const map = {
    dashboard: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="10" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>),
    members: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M3 21c1-4 6-6 6-6s5 2 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    checkins: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    stats: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.2"/><path d="m19 9-5 5-4-4-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="11" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/></svg>),
    packages: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1" fill="none"/></svg>),
    reports: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.2"/><path d="M7 14h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>),
    settings: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 1-1.95-.41 1.65 1.65 0 0 0-2.33 0 1.65 1.65 0 0 1-1.95.41 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 1-.41-1.95 1.65 1.65 0 0 0 0-2.33 1.65 1.65 0 0 1 .41-1.95 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.1 2.1l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 1 1.95.41 1.65 1.65 0 0 0 2.33 0 1.65 1.65 0 0 1 1.95-.41 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.4 4.6l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 1 .41 1.95 1.65 1.65 0 0 0 0 2.33 1.65 1.65 0 0 1-.41 1.95z" stroke="currentColor" strokeWidth="1"/></svg>),
  };
  return <span className="side-icon">{map[name]}</span>;
};


export default function Sidebar() {
  const { currentUser } = useAuth() || {};
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';
  const [showAddUser, setShowAddUser] = useState(false);

  const handleOpenAddUser = () => setShowAddUser(true);
  const handleCloseAddUser = () => setShowAddUser(false);
  const handleSubmitAddUser = async (userData) => {
    console.log("🚀 ~ handleSubmitAddUser ~ userData:", userData);
    
    try {
      // Bước 1: Kiểm tra số điện thoại và TẠO USER TRƯỚC
      console.log('🔍 Bước 1: Kiểm tra và tạo user trong spending_users...');
      
      // Loại bỏ các trường không thuộc schema của SpendingUser
      const {
        package_name: _package_name,
        package_price: _package_price,
        package_duration: _package_duration,
        ...validUserData
      } = userData;
      
      // Tạo user trong spending_users (sẽ kiểm tra duplicate phone number)
      const newUser = await AuthService.createUserByAdmin(validUserData);
      console.log('✅ User đã được tạo trong spending_users:', newUser);
      
      // Bước 2: Tạo link thanh toán PayOS
      console.log('💳 Bước 2: Tạo payment link...');
      const res = await fetch('/api/payos/create-gym-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: userData.current_package_id,
          packageName: userData.package_name,
          packagePrice: userData.package_price,
          packageDuration: userData.package_duration,
          userId: newUser._id, // Dùng user ID thực tế
          userName: userData.full_name,
          userEmail: userData.email,
          userPhone: userData.phone_number,
          returnUrl: `${window.location.origin}/admin/members?userId=${newUser._id}`,
          cancelUrl: `${window.location.origin}/admin/members?userId=${newUser._id}&cancelled=true`,
        }),
      });

      const paymentData = await res.json();
      
      if (paymentData.success && paymentData.data && paymentData.data.checkoutUrl) {
        // Bước 3: Lưu userId để xử lý sau khi thanh toán
        localStorage.setItem('pendingPaymentUserId', newUser._id);
        localStorage.setItem('pendingPaymentOrderCode', paymentData.data.orderCode);
        
        console.log('🔗 Bước 3: Chuyển hướng đến trang thanh toán...');
        // Chuyển hướng đến trang thanh toán PayOS
        window.location.href = paymentData.data.checkoutUrl;
      } else {
        // Nếu không tạo được payment link, xóa user đã tạo
        console.error('❌ Không thể tạo payment link, đang xóa user...');
        await AuthService.deleteSpendingUser(newUser._id);
        alert('Không thể tạo link thanh toán: ' + (paymentData.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error("❌ Lỗi trong handleSubmitAddUser:", error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  return (
    <>
      <aside className="admin-sidebar">
        <button className="mobile-close" onClick={() => window.dispatchEvent(new CustomEvent('closeAdminMenu'))}>✕</button>

        <div className="side-brand"><NavLink to="/admin" style={{textDecoration:'none', color:'inherit'}}>REPS</NavLink></div>

        <nav className="side-nav">
          <NavLink to="/admin" end className={({isActive})=> isActive? 'active':''}><Icon name="dashboard"/> Dashboard</NavLink>
          <NavLink to="/admin/members" className={({isActive})=> isActive? 'active':''}><Icon name="members"/> Members</NavLink>
          <NavLink to="/admin/checkins" className={({isActive})=> isActive? 'active':''}><Icon name="checkins"/> Check-ins</NavLink>
          <NavLink to="/admin/checkin-stats" className={({isActive})=> isActive? 'active':''}><Icon name="stats"/> Thống kê Check-in</NavLink>
          <NavLink to="/admin/packages" className={({isActive})=> isActive? 'active':''}><Icon name="packages"/> Packages</NavLink>
          <NavLink to="/admin/reports" className={({isActive})=> isActive? 'active':''}><Icon name="reports"/> Reports</NavLink>
          <NavLink to="/admin/settings" className={({isActive})=> isActive? 'active':''}><Icon name="settings"/> Settings</NavLink>
        </nav>

        <div className="side-cta"> 
          <button className="btn small" onClick={handleOpenAddUser}>+ Tạo mới</button>
        </div>

        <div className="side-profile">
          <div className="avatar">{displayName[0]?.toUpperCase()}</div>
          <div className="profile-meta">
            <div className="name">{displayName}</div>
            <div className="email">{currentUser?.email ?? 'admin@example.com'}</div>
          </div>
        </div>
      </aside>
      <AddNewUser isOpen={showAddUser} onClose={handleCloseAddUser} onSubmit={handleSubmitAddUser} />
    </>
  );
}
