import React, { useState, useEffect } from 'react';
import { EmployeeProvider, useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import AddEmployeeModal from '../components/AddEmployeeModal.jsx';
import EditEmployeeModal from '../components/EditEmployeeModal.jsx';
import EmployeeAvatar from '../../../shared/components/EmployeeAvatar/EmployeeAvatar.jsx';
import './Employees.css';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

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
    console.log('🔧 Edit employee clicked:', employee);
    console.log('🆔 Employee ID fields:', { _id: employee._id, id: employee.id });
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  // Confirm delete employee
  const confirmDeleteEmployee = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete._id);
        setShowDeleteConfirm(false);
        setEmployeeToDelete(null);
      } catch (error) {
        console.error('Error deleting employee:', error);
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
      <div className="employees-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách nhân viên...</p>
      </div>
    );
  }

  return (
    <div className="employees-container">
      {/* Header */}
      <div className="employees-header">
        <div className="header-left">
          <h1>Quản Lý Nhân Viên</h1>
          <p>Quản lý thông tin và theo dõi hoạt động nhân viên</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-add-employee"
            onClick={() => setShowAddModal(true)}
          >
            <span className="icon">👥</span>
            Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="employees-stats">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Tổng nhân viên</p>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Đang làm việc</p>
          </div>
        </div>
        
        <div className="stat-card pt">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>{stats.pt}</h3>
            <p>PT</p>
          </div>
        </div>
        
        <div className="stat-card recent">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.recentHires}</h3>
            <p>Tuyển mới (30 ngày)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="employees-filters">
        <div className="filters-row-employees">
          <div className="search-box-employees">
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên (tên, email, SĐT)..."
              value={filters.searchQuery || ''}
              onChange={handleSearchChange}
            />
            <span className="search-icon-employees">🔍</span>
          </div>

          <div className="filter-group-employees">
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

          <div className="filter-group-employees">
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

          <div className="filter-group-employees">
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
            <button className="clear-filters-employees" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="employees-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className="employees-table-container">
        {employees.length === 0 ? (
          <div className="no-employees">
            <div className="no-data-icon">👥</div>
            <h3>Chưa có nhân viên nào</h3>
            <p>Hãy thêm nhân viên đầu tiên cho phòng gym</p>
            <button 
              className="btn-add-first"
              onClick={() => setShowAddModal(true)}
            >
              Thêm nhân viên đầu tiên
            </button>
          </div>
        ) : (
          <div className="employees-table">
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
                      <div className="employee-info">
                        <div className="avatar">
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
                            className="avatar-text"
                            style={{ display: employee.avatarUrl ? 'none' : 'flex' }}
                          >
                            {employee.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="info">
                          <h4>{employee.fullName}</h4>
                          <p className="employee-id">ID: {employee._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <p className="phone">📞 {employee.phone}</p>
                        <p className="email">📧 {employee.email}</p>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="position-badge"
                        style={{ backgroundColor: getPositionColor(employee.position) }}
                      >
                        {employee.position}
                      </span>
                      {employee.position === 'PT' && employee.totalClients > 0 && (
                        <small className="client-count">
                          {employee.totalClients} khách hàng
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(employee.status)}`}>
                        {employee.status === 'active' && 'Đang làm việc'}
                        {employee.status === 'inactive' && 'Tạm nghỉ'}
                        {employee.status === 'resigned' && 'Đã nghỉ việc'}
                        {employee.status === 'suspended' && 'Tạm đình chỉ'}
                      </span>
                    </td>
                    <td>
                      <div className="salary-info">
                        <span className="salary">{formatSalary(employee.salary)}</span>
                        {employee.commissionRate > 0 && (
                          <small className="commission">
                            +{employee.commissionRate}% hoa hồng
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(employee.startDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit-employee"
                          onClick={() => handleEditEmployee(employee)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className=" btn-delete-employee"
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
              <div className="load-more-section">
                <button
                  className={`load-more-btn ${loadingMore ? 'loading' : ''}`}
                  onClick={fetchMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className="spinner"></div>
                      Đang tải thêm...
                    </>
                  ) : (
                    <>
                      <span className="icon">⬇️</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && employeeToDelete && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h3>Xác nhận xóa nhân viên</h3>
            <p>
              Bạn có chắc chắn muốn xóa nhân viên{' '}
              <strong>{employeeToDelete.fullName}</strong>?
            </p>
            <p className="warning">
              ⚠️ Hành động này không thể hoàn tác!
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEmployeeToDelete(null);
                }}
              >
                Hủy
              </button>
              <button
                className="btn-confirm-delete"
                onClick={confirmDeleteEmployee}
              >
                Xóa nhân viên
              </button>
            </div>
          </div>
        </div>
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