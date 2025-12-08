import React, { useState, useEffect } from 'react';
import { EmployeeProvider, useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import AddEmployeeModal from '../components/AddEmployeeModal.jsx';
import EditEmployeeModal from '../components/EditEmployeeModal.jsx';
import EmployeeAvatar from '../../../shared/components/EmployeeAvatar/EmployeeAvatar.jsx';
import Swal from 'sweetalert2';
import styles from './Employees.module.css';

function EmployeesContent() {
  const {
    employees,
    loading,
    loadingMore,
    error,
    fetchMore,
    hasMore,
    filters,
    updateFilters,
    deleteEmployee,
    stats
  } = useEmployees();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = async (employee) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa nhân viên',
      html: `Bạn có chắc chắn muốn xóa nhân viên <strong>${employee.fullName}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await deleteEmployee(employee._id);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Xóa nhân viên thành công!',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2'
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra khi xóa nhân viên',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2'
        });
      }
    }
  };

  // Format salary display
  const formatSalary = (salary) => {
    if (!salary) return 'Chưa cập nhật';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(salary);
  };

  // Format date display
  const formatDate = (date) => {
    if (!date) return 'N/A';
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
      <div className={styles.employeesLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải danh sách nhân viên...</p>
      </div>
    );
  }

  return (
    <div className={styles.employeesContainer}>
      {/* Header */}
      <div className={styles.employeesHeader}>
        <div className={styles.headerLeft}>
          <h1>Quản Lý Nhân Viên</h1>
          <p>Quản lý thông tin và theo dõi hoạt động nhân viên</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.btnAddEmployee}
            onClick={() => setShowAddModal(true)}
          >
            <span className={styles.icon}>👥</span>
            Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.employeesStats}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats.total}</h3>
            <p>Tổng nhân viên</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.active}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{stats.active}</h3>
            <p>Đang làm việc</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.pt}`}>
          <div className={styles.statIcon}>💪</div>
          <div className={styles.statContent}>
            <h3>{stats.pt}</h3>
            <p>PT</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.recent}`}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <h3>{stats.recentHires}</h3>
            <p>Tuyển mới (30 ngày)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.employeesFilters}>
        <div className={styles.filtersRowEmployees}>
          <div className={styles.searchBoxEmployees}>
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên (tên, email, SĐT)..."
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
            />
            <span className={styles.searchIconEmployees}>🔍</span>
          </div>

          <div className={styles.filterGroupEmployees}>
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

          <div className={styles.filterGroupEmployees}>
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

          <div className={styles.filterGroupEmployees}>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">Tất cả quyền</option>
              <option value="employee">Nhân viên</option>
              <option value="pt">PT</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(filters.status || filters.position || filters.role || filters.searchQuery) && (
            <button className={styles.clearFiltersEmployees} onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={styles.employeesError}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className={styles.employeesTableContainer}>
        {employees.length === 0 ? (
          <div className={styles.noEmployees}>
            <div className={styles.noDataIcon}>👥</div>
            <h3>Chưa có nhân viên nào</h3>
            <p>Hãy thêm nhân viên đầu tiên cho phòng gym</p>
            <button 
              className={styles.btnAddFirst}
              onClick={() => setShowAddModal(true)}
            >
              Thêm nhân viên đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.employeesTable}>
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Liên hệ</th>
                  <th>Vị trí</th>
                  <th>Trạng thái</th>
                  <th>Lương</th>
                  <th>Ngày bắt đầu</th>
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
                                // Fallback to initials if image fails to load
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
                          <p className={styles.employeeId}>ID: {employee._id.slice(-6)}</p>
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
                        className={styles.positionBadge}
                        style={{ backgroundColor: getPositionColor(employee.position) }}
                      >
                        {employee.position}
                      </span>
                      {employee.position === 'PT' && employee.totalClients > 0 && (
                        <small className={styles.clientCount}>
                          {employee.totalClients} khách hàng
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadgeEmployees} ${styles[getStatusBadge(employee.status).replace('status-', 'status')]}`}>
                        {employee.status === 'active' && 'Đang làm việc'}
                        {employee.status === 'inactive' && 'Tạm nghỉ'}
                        {employee.status === 'resigned' && 'Đã nghỉ việc'}
                        {employee.status === 'suspended' && 'Tạm đình chỉ'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.salaryInfo}>
                        <span className={styles.salary}>{formatSalary(employee.salary)}</span>
                        {employee.commissionRate > 0 && (
                          <small className={styles.commission}>
                            +{employee.commissionRate}% hoa hồng
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(employee.startDate)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.btnEditEmployee}
                          onClick={() => handleEditEmployee(employee)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.btnDeleteEmployee}
                          onClick={() => handleDeleteClick(employee)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Load More Button */}
            {hasMore && (
              <div className={styles.loadMoreSection}>
                <button
                  className={`${styles.loadMoreBtn} ${loadingMore ? styles.loading : ''}`}
                  onClick={fetchMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className={styles.spinner}></div>
                      Đang tải thêm...
                    </>
                  ) : (
                    <>
                      <span className={styles.icon}>⬇️</span>
                      Tải thêm nhân viên
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
        />
      )}

    </div>
  );
}

export default function Employees() {
  return (
    <EmployeeProvider>
      <EmployeesContent />
    </EmployeeProvider>
  );
}
