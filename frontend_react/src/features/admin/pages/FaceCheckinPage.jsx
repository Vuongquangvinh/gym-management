import React, { useState, useEffect } from 'react';
import { EmployeeProvider, useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import FaceRegistrationModal from '../components/FaceRegistrationModal.jsx';
import FaceCheckinModal from '../components/FaceCheckinModal.jsx';
import EmployeeAvatar from '../../../shared/components/EmployeeAvatar/EmployeeAvatar.jsx';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import styles from './FaceCheckinPage.module.css';

function FaceCheckinContent() {
  const {
    employees,
    loading,
    error,
    filters,
    updateFilters,
    refreshEmployees
  } = useEmployees();

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [faceStats, setFaceStats] = useState({
    total: 0,
    registered: 0,
    unregistered: 0,
    todayCheckins: 0
  });

  // Calculate face registration stats
  useEffect(() => {
    if (employees.length > 0) {
      const registered = employees.filter(emp => emp.faceRegistered === true).length;
      const unregistered = employees.filter(emp => emp.faceRegistered === false || !emp.faceRegistered).length;
      
      setFaceStats({
        total: employees.length,
        registered,
        unregistered,
        todayCheckins: 0 // Will be calculated from checkins
      });
    }
  }, [employees]);

  // Handle search input change
  const handleSearchChange = (e) => {
    updateFilters({ searchQuery: e.target.value });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    updateFilters({ [filterType]: value });
  };

  // Clear all filters
  const clearFilters = () => {
    updateFilters({
      status: '',
      position: '',
      role: '',
      searchQuery: ''
    });
  };

  // Handle face registration
  const handleFaceRegistration = (employee) => {
    setSelectedEmployee(employee);
    setShowRegistrationModal(true);
  };

  // Handle delete confirmation click
  const handleDeleteClick = async (employee) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa Face ID',
      html: `Bạn có chắc chắn muốn xóa Face ID của <strong>${employee.fullName}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const response = await fetch(`${API_BASE_URL}/api/face/delete/${employee._id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Xóa Face ID thành công!',
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#1976d2'
          });
          // No need to refreshEmployees() - onSnapshot will auto-update
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Xóa Face ID thất bại: ' + result.message,
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#1976d2'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra khi xóa Face ID',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2'
        });
      }
    }
  };

  // Format date display
  const formatDate = (date) => {
    if (!date) return 'Chưa đăng ký';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'resigned': return 'status-resigned';
      case 'suspended': return 'status-suspended';
      default: return 'status-default';
    }
  };

  // Get position color
  const getPositionColor = (position) => {
    switch (position) {
      case 'PT': return '#e74c3c';
      case 'Quản lý': return '#9b59b6';
      case 'Lễ tân': return '#3498db';
      case 'Kế toán': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className={styles.faceCheckinLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải danh sách nhân viên...</p>
      </div>
    );
  }

  return (
    <div className={styles.faceCheckinContainer}>
      {/* Header */}
      <div className={styles.faceCheckinHeader}>
        <div className={styles.headerLeft}>
          <h1>🎭 Quản Lý Face Checkin</h1>
          <p>Đăng ký và quản lý hệ thống nhận diện khuôn mặt</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.btnFaceCheckin}
            onClick={() => setShowCheckinModal(true)}
          >
            <span className={styles.icon}>📷</span>
            Face Check-in
          </button>
          <button 
            className={styles.btnRegisterFace}
            onClick={() => {
              toast.info('Vui lòng chọn nhân viên từ bảng bên dưới để đăng ký Face ID', {
                position: "top-right",
                autoClose: 3000,
              });
            }}
          >
            <span className={styles.icon}>👤</span>
            Đăng ký khuôn mặt
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className={styles.faceCheckinInfoBanner}>
        <div className={styles.infoIcon}>ℹ️</div>
        <div className={styles.infoContent}>
          <strong>Lưu ý quan trọng:</strong> Chỉ những nhân viên có lịch làm việc trong ngày mới có thể sử dụng Face ID để check-in/check-out. 
          Nhân viên parttime cần được xếp lịch trước, nhân viên fulltime luôn có lịch làm việc.
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.faceCheckinStats}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{faceStats.total}</h3>
            <p>Tổng nhân viên</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.registered}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{faceStats.registered}</h3>
            <p>Đã đăng ký Face ID</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.unregistered}`}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statContent}>
            <h3>{faceStats.unregistered}</h3>
            <p>Chưa đăng ký Face ID</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.checkins}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3>{faceStats.todayCheckins}</h3>
            <p>Check-in hôm nay</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.faceCheckinFilters}>
        <div className={styles.filtersRowFaceCheckin}>
          <div className={styles.searchBoxFaceCheckin}>
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên (tên, email, SĐT)..."
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
            />
            <span className={styles.searchIconFaceCheckin}>🔍</span>
          </div>

          <div className={styles.filterGroupFaceCheckin}>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="inactive">Tạm nghỉ</option>
              <option value="resigned">Đã nghỉ việc</option>
              <option value="suspended">Tạm đình chỉ</option>
            </select>
          </div>

          <div className={styles.filterGroupFaceCheckin}>
            <select
              value={filters.position || ''}
              onChange={(e) => handleFilterChange('position', e.target.value)}
            >
              <option value="">Tất cả vị trí</option>
              <option value="PT">PT</option>
              <option value="Lễ tân">Lễ tân</option>
              <option value="Quản lý">Quản lý</option>
              <option value="Kế toán">Kế toán</option>
              <option value="Bảo vệ">Bảo vệ</option>
              <option value="Vệ sinh">Vệ sinh</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className={styles.filterGroupFaceCheckin}>
            <select
              value={filters.faceStatus || ''}
              onChange={(e) => handleFilterChange('faceStatus', e.target.value)}
            >
              <option value="">Tất cả Face ID</option>
              <option value="registered">Đã đăng ký</option>
              <option value="unregistered">Chưa đăng ký</option>
            </select>
          </div>

          {(filters.status || filters.position || filters.faceStatus || filters.searchQuery) && (
            <button className={styles.clearFiltersFaceCheckin} onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={styles.faceCheckinError}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className={styles.faceCheckinTableContainer}>
        {employees.length === 0 ? (
          <div className={styles.noEmployees}>
            <div className={styles.noDataIcon}>👥</div>
            <h3>Chưa có nhân viên nào</h3>
            <p>Hãy thêm nhân viên đầu tiên cho phòng gym</p>
          </div>
        ) : (
          <div className={styles.faceCheckinTable}>
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Liên hệ</th>
                  <th>Vị trí</th>
                  <th>Trạng thái</th>
                  <th>Ngày đăng ký</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>
                      <div className={styles.employeeInfo}>
                        <div className={styles.avatar}>
                          {employee.avatarUrl ? (
                            <EmployeeAvatar 
                              src={employee.avatarUrl} 
                              alt={employee.fullName}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span 
                            className={styles.avatarText}
                            style={{ display: employee.avatarUrl ? 'none' : 'flex' }}
                          >
                            {employee.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.info}>
                          <h4>{employee.fullName}</h4>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <p className={styles.phone}>📞 {employee.phone}</p>
                        <p className={styles.email}>📧 {employee.email}</p>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={styles.positionBadgeCheckin}
                        style={{ backgroundColor: getPositionColor(employee.position) }}
                      >
                        {employee.position}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadgeCheckin} ${styles[getStatusBadge(employee.status)]}`}>
                        {employee.status === 'active' && 'Đang làm việc'}
                        {employee.status === 'inactive' && 'Tạm nghỉ'}
                        {employee.status === 'resigned' && 'Đã nghỉ việc'}
                        {employee.status === 'suspended' && 'Tạm đình chỉ'}
                      </span>
                    </td>
                    <td>
                      {employee.faceIdCreatedAt 
                        ? formatDate(employee.faceIdCreatedAt.toDate?.() || employee.faceIdCreatedAt)
                        : employee.faceRegistered 
                          ? formatDate(employee.faceRegistrationDate)
                          : '—'
                      }
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {!employee.faceRegistered ? (
                          <button
                            className={styles.btnRegisterFaceAction}
                            onClick={() => handleFaceRegistration(employee)}
                            title="Đăng ký Face ID"
                          >
                            📷 Đăng ký
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.btnRegisteredFace}
                              disabled
                              title="Đã đăng ký Face ID"
                            >
                              ✅ Đã đăng ký
                            </button>
                            <button
                              className={styles.btnDeleteFace}
                              onClick={() => handleDeleteClick(employee)}
                              title="Xóa Face ID"
                            >
                              🗑️ Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Face Registration Modal */}
      {showRegistrationModal && (
        <FaceRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => {
            setShowRegistrationModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onRegistrationSuccess={refreshEmployees}
        />
      )}

      {/* Face Checkin Modal */}
      {showCheckinModal && (
        <FaceCheckinModal
          isOpen={showCheckinModal}
          onClose={() => setShowCheckinModal(false)}
        />
      )}

    </div>
  );
}

export default function FaceCheckinPage() {
  return (
    <EmployeeProvider>
      <FaceCheckinContent />
    </EmployeeProvider>
  );
}
