import React, { useState, useEffect, useRef } from 'react';
import AddNewUser from '../../../features/admin/components/AddNewUser.jsx';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import AuthService from '../../../firebase/lib/features/auth/authService.js';

import styles from '../../../features/admin/admin.module.css';
// small inline SVG icons to avoid adding deps
const Icon = ({ name }) => {
  const map = {
    dashboard: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="10" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>),
    members: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M3 21c1-4 6-6 6-6s5 2 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    employees: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2"/></svg>),
    checkins: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    stats: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.2"/><path d="m19 9-5 5-4-4-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="11" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/></svg>),
    packages: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1" fill="none"/></svg>),
    reports: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.2"/><path d="M7 14h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>),
    settings: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 1-1.95-.41 1.65 1.65 0 0 0-2.33 0 1.65 1.65 0 0 1-1.95.41 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 1-.41-1.95 1.65 1.65 0 0 0 0-2.33 1.65 1.65 0 0 1 .41-1.95 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.1 2.1l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 1 1.95.41 1.65 1.65 0 0 0 2.33 0 1.65 1.65 0 0 1 1.95-.41 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.4 4.6l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 1 .41 1.95 1.65 1.65 0 0 0 0 2.33 1.65 1.65 0 0 1-.41 1.95z" stroke="currentColor" strokeWidth="1"/></svg>),
    pt: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2"/><path d="M20 8h2m-1-1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>),
    face: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2"/><path d="M8 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2"/></svg>),
    schedule: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.2"/></svg>),
    chevronDown: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    clock: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    financial: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    payroll: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.2"/><path d="M12 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  };
  return <span className={styles.sideIcon}>{map[name]}</span>;
};


export default function Sidebar() {
  const { currentUser } = useAuth() || {};
  const location = useLocation();
  const dropdownRef = useRef(null);
  const checkinDropdownRef = useRef(null);
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';
  const [showAddUser, setShowAddUser] = useState(false);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [checkinDropdownOpen, setCheckinDropdownOpen] = useState(false);

  const handleOpenAddUser = () => setShowAddUser(true);
  const handleCloseAddUser = () => setShowAddUser(false);
  const toggleEmployeeDropdown = () => setEmployeeDropdownOpen(!employeeDropdownOpen);
  const toggleCheckinDropdown = () => setCheckinDropdownOpen(!checkinDropdownOpen);

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setEmployeeDropdownOpen(false);
    setCheckinDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEmployeeDropdownOpen(false);
      }
      if (checkinDropdownRef.current && !checkinDropdownRef.current.contains(event.target)) {
        setCheckinDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleSubmitAddUser = async (userData) => {
    try {
      // Bước 1: Kiểm tra số điện thoại và TẠO USER TRƯỚC
      // Loại bỏ các trường không thuộc schema của SpendingUser
      const {
        package_name: _package_name,
        package_price: _package_price,
        package_duration: _package_duration,
        ...validUserData
      } = userData;
      
      // Tạo user trong spending_users (sẽ kiểm tra duplicate phone number)
      const newUser = await AuthService.createUserByAdmin(validUserData);
      
      // Bước 2: Tạo link thanh toán PayOS
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
        
        // Chuyển hướng đến trang thanh toán PayOS
        window.location.href = paymentData.data.checkoutUrl;
      } else {
        // Nếu không tạo được payment link, xóa user đã tạo
        await AuthService.deleteSpendingUser(newUser._id);
        alert('Không thể tạo link thanh toán: ' + (paymentData.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  return (
    <>
      <aside className={styles.adminSidebar}>
        <button className={styles.mobileClose} onClick={() => window.dispatchEvent(new CustomEvent('closeAdminMenu'))}>✕</button>

        <div className={styles.sideBrand}><NavLink to="/admin" style={{textDecoration:'none', color: 'var(--primary-color)'}}>REPS</NavLink></div>

        <nav className={styles.sideNav}>
          <NavLink to="/admin" end className={({isActive})=> isActive? styles.active:''}><Icon name="dashboard"/> Tổng quan</NavLink>
          <NavLink to="/admin/members" className={({isActive})=> isActive? styles.active:''}><Icon name="members"/> Thành viên</NavLink>
          
          {/* Employee Dropdown */}
          <div className={styles.navDropdown} ref={dropdownRef}>
            <button 
              className={`${styles.navDropdownTrigger} ${employeeDropdownOpen ? styles.open : ''}`}
              onClick={toggleEmployeeDropdown}
            >
              <Icon name="employees"/> 
              <span>Nhân viên</span>
              <Icon name="chevronDown"/>
            </button>
            
            {employeeDropdownOpen && (
              <div className={styles.navDropdownContent}>
                <NavLink to="/admin/employees" className={({isActive})=> isActive? styles.active:''}> 
                  <Icon name="employees"/> Quản lý nhân viên
                </NavLink>
                <NavLink to="/admin/pt-pricing" className={({isActive})=> isActive? styles.active:''}> 
                  <Icon name="pt"/> Quản lý PT
                </NavLink>
                <NavLink to="/admin/pending-requests" className={({isActive})=> isActive? styles.active:''}> 
                  <Icon name="clock"/> Yêu cầu chờ duyệt
                </NavLink>
              </div>
            )}
          </div>

          {/* Check-in Dropdown */}
          <div className={styles.navDropdown} ref={checkinDropdownRef}>
            <button 
              className={`${styles.navDropdownTrigger} ${checkinDropdownOpen ? styles.open : ''}`}
              onClick={toggleCheckinDropdown}
            >
              <Icon name="checkins"/> 
              <span>Check-in</span>
              <Icon name="chevronDown"/>
            </button>
            
            {checkinDropdownOpen && (
              <div className={styles.navDropdownContent}>
                <NavLink to="/admin/checkins" className={({isActive})=> isActive? styles.active:''}> 
                  <Icon name="checkins"/> Điểm danh
                </NavLink>
                <NavLink to="/admin/checkin-stats" className={({isActive})=> isActive? styles.active:''}> 
                  <Icon name="stats"/> Thống kê điểm danh
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/admin/face-checkin" className={({isActive})=> isActive? styles.active:''}><Icon name="face"/> Nhận diện khuôn mặt</NavLink>
          <NavLink to="/admin/schedule" className={({isActive})=> isActive? styles.active:''}><Icon name="schedule"/> Lịch làm việc</NavLink>
          <NavLink to="/admin/packages" className={({isActive})=> isActive? styles.active:''}><Icon name="packages"/> Gói tập</NavLink>
          <NavLink to="/admin/financial" className={({isActive})=> isActive? styles.active:''}><Icon name="financial"/> Tài chính</NavLink>
          <NavLink to="/admin/operating-expenses" className={({isActive})=> isActive? styles.active:''}><Icon name="financial"/> Chi phí vận hành</NavLink>
          <NavLink to="/admin/payroll" className={({isActive})=> isActive? styles.active:''}><Icon name="payroll"/> Bảng lương</NavLink>
      
          <NavLink to="/admin/settings" className={({isActive})=> isActive? styles.active:''}><Icon name="settings"/> Cài đặt</NavLink>
        </nav>

        <div className={styles.sideCta}> 
          <button className={`${styles.btn} ${styles.small}`} onClick={handleOpenAddUser}>+ Tạo mới</button>
        </div>

        <div className={styles.sideProfile}>
          <div className={styles.avatar}>{displayName[0]?.toUpperCase()}</div>
          <div className={styles.profileMeta}>
            <div className={styles.name}>{displayName}</div>
            <div className={styles.email}>{currentUser?.email ?? 'admin@example.com'}</div>
          </div>
        </div>
      </aside>
      <AddNewUser isOpen={showAddUser} onClose={handleCloseAddUser} onSubmit={handleSubmitAddUser} />
    </>
  );
}
