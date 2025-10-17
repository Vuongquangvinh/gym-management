import React, { useState, useCallback, useEffect, useRef } from "react";
import "./DataTableCheckin.css";
import { useCheckins } from "../../../firebase/lib/features/checkin";
import EditCheckinModal from "./EditCheckinModal.jsx";
import { toast } from 'react-toastify';

export default function DataTableCheckin({ onAddCheckin }) {
  // Get data và methods từ provider
  const {
    checkins,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    updateFilters,
    loadMore,
    editCheckin,
    deleteCheckin
  } = useCheckins();

  // Local state cho filter inputs
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || "");
  const [dateFilter, setDateFilter] = useState(filters.date || "");
  const [sourceFilter, setSourceFilter] = useState(filters.source || "");

  // State cho edit/delete functionality
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  // Refs cho debouncing và focus management
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const shouldMaintainFocusRef = useRef(false);

  // Debounced search function - STABLE (không depend vào state thay đổi)
  const debouncedSearch = useCallback((searchValue, dateValue, sourceValue) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = {
        searchQuery: searchValue.trim(),
        date: dateValue,
        source: sourceValue,
      };
      console.log('DataTableCheckin - Debounced search:', newFilters);
      shouldMaintainFocusRef.current = true; // Mark to maintain focus
      updateFilters(newFilters);
    }, 300); // 300ms delay
  }, [updateFilters]);

  // Handle search input change - KHÔNG gọi updateFilters ngay lập tức
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value); // Chỉ update local state
    
    // Debounced search
    debouncedSearch(value, dateFilter, sourceFilter);
  }, [debouncedSearch, dateFilter, sourceFilter]);

  // Maintain focus after re-render
  useEffect(() => {
    if (shouldMaintainFocusRef.current && inputRef.current) {
      const input = inputRef.current;
      const cursorPosition = input.selectionStart;
      
      // Re-focus và restore cursor position
      input.focus();
      input.setSelectionRange(cursorPosition, cursorPosition);
      
      shouldMaintainFocusRef.current = false;
    }
  }, [checkins, loading]); // Trigger khi data changes

  // Handle date change - immediate update
  const handleDateChange = useCallback((e) => {
    const value = e.target.value;
    setDateFilter(value);
    
    // Clear search timeout và update ngay
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const newFilters = {
      searchQuery: searchQuery.trim(),
      date: value,
      source: sourceFilter,
    };
    console.log('DataTableCheckin - Date changed:', newFilters);
    updateFilters(newFilters);
  }, [searchQuery, sourceFilter, updateFilters]);

  // Handle source change - immediate update  
  const handleSourceChange = useCallback((e) => {
    const value = e.target.value;
    setSourceFilter(value);
    
    // Clear search timeout và update ngay
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const newFilters = {
      searchQuery: searchQuery.trim(),
      date: dateFilter,
      source: value,
    };
    console.log('DataTableCheckin - Source changed:', newFilters);
    updateFilters(newFilters);
  }, [searchQuery, dateFilter, updateFilters]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    console.log('DataTableCheckin - Load more clicked');
    loadMore();
  }, [loadMore]);

  // Handle edit checkin
  const handleEditCheckin = useCallback((checkin) => {
    setSelectedCheckin(checkin);
    setEditModalOpen(true);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async (id, updateData) => {
    try {
      await editCheckin(id, updateData);
      setEditModalOpen(false);
      setSelectedCheckin(null);
      
      // Show success toast
      toast.success('Cập nhật thời gian check-in thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      toast.error('Có lỗi xảy ra khi cập nhật check-in', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [editCheckin]);

  // Handle delete checkin from modal
  const handleDeleteFromModal = useCallback(async (id) => {
    try {
      await deleteCheckin(id);
      setEditModalOpen(false);
      setSelectedCheckin(null);
      
      // Show success toast
      toast.success('Xóa check-in thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error deleting checkin:', error);
      toast.error('Có lỗi xảy ra khi xóa check-in', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      throw error; // Re-throw để modal có thể handle
    }
  }, [deleteCheckin]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Format thời gian
  const formatDateTime = (dateTimeStr) => {
    try {
      // Handle both Firestore Timestamp and ISO string
      let date;
      if (dateTimeStr && dateTimeStr.toDate) {
        // Firestore Timestamp
        date = dateTimeStr.toDate();
      } else {
        // ISO string or regular Date
        date = new Date(dateTimeStr);
      }
      
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="checkin-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu check-in...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="checkin-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Có lỗi xảy ra</h3>
          <p>Lỗi: {error.message}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      {/* Header Section */}
      <div className="header-content">
        <div className="header-main">
          <div className="header-text">
            <h1 className="page-title">Quản lý Check-in</h1>
            <p className="page-subtitle">Theo dõi và quản lý lịch sử check-in của thành viên</p>
          </div>
          {onAddCheckin && (
            <div className="header-actions">
              <button 
                className="add-checkin-btn"
                onClick={onAddCheckin}
                title="Thêm check-in mới"
              >
                <span className="btn-icon">➕</span>
                <span className="btn-text">Thêm check-in</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Check-ins hiện tại</div>
            <div className="stat-icon current">👥</div>
          </div>
          <div className="stat-value">{checkins.length}</div>
          <div className="stat-description">Tổng số lượt check-in</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Hôm nay</div>
            <div className="stat-icon today">🕐</div>
          </div>
          <div className="stat-value">
            {checkins.filter(c => {
              const today = new Date();
              const checkinDate = c.checkedAt?.toDate ? c.checkedAt.toDate() : new Date(c.checkedAt);
              return checkinDate.toDateString() === today.toDateString();
            }).length}
          </div>
          <div className="stat-description">Check-in trong ngày</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">QR Code</div>
            <div className="stat-icon qr">📱</div>
          </div>
          <div className="stat-value">
            {checkins.filter(c => c.source === 'QR').length}
          </div>
          <div className="stat-description">Quét QR Code</div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-header">
          <div className="filters-title-section">
            <div className="filters-icon">🔍</div>
            <h3 className="filters-title">Bộ lọc tìm kiếm</h3>
          </div>
          <div className="filters-summary">
            {(searchQuery || dateFilter || sourceFilter) && (
              <span className="active-filters">
                {[searchQuery && 'Tìm kiếm', dateFilter && 'Ngày', sourceFilter && 'Nguồn'].filter(Boolean).join(', ')} đang được áp dụng
              </span>
            )}
          </div>
        </div>
        
        <div className="filters-content">
          <div className="filter-group search-group">
            <label className="filter-label">
              <span className="label-icon">👤</span>
              Tìm kiếm thành viên
            </label>
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập tên thành viên hoặc số điện thoại..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  console.log('Input focused');
                  shouldMaintainFocusRef.current = false;
                }}
                onBlur={() => {
                  console.log('Input blurred');
                }}
                className="filter-input search-input"
              />
              <div className="input-icon">🔍</div>
            </div>
          </div>
          
          <div className="filter-group date-group">
            <label className="filter-label">
              <span className="label-icon">📅</span>
              Chọn ngày
            </label>
            <div className="input-wrapper">
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                className="filter-input date-input"
              />
              <div className="input-icon">📅</div>
            </div>
            {dateFilter && (
              <div className="filter-hint">
                Hiển thị check-in từ {new Date(dateFilter).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
          
          <div className="filter-group source-group">
            <label className="filter-label">
              <span className="label-icon">📱</span>
              Nguồn check-in
            </label>
            <div className="select-wrapper">
              <select
                value={sourceFilter}
                onChange={handleSourceChange}
                className="filter-input source-select"
              >
                <option value="">🔄 Tất cả nguồn</option>
                <option value="QR">📱 QR Code</option>
                <option value="manual">✋ Thủ công</option>
              </select>
              <div className="select-arrow">▼</div>
            </div>
            {sourceFilter && (
              <div className="filter-hint">
                Chỉ hiển thị check-in từ {sourceFilter === 'QR' ? 'QR Code' : 'nhập thủ công'}
              </div>
            )}
          </div>
          
          <div className="filter-actions">
            <button 
              className="filter-btn secondary"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
                setSourceFilter('');
              }}
            >
              <span>🗑️</span>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title-section">
            <h3 className="table-title">
              <span className="table-icon">📊</span>
              Lịch sử check-in
            </h3>
            <div className="table-stats">
              <span className="total-count">{checkins.length} mục</span>
              <div className="status-indicators">
                <span className="indicator qr-indicator">
                  <span className="dot"></span>
                  QR Code ({checkins.filter(c => c.source === 'QR').length})
                </span>
                <span className="indicator manual-indicator">
                  <span className="dot"></span>
                  Thủ công ({checkins.filter(c => c.source === 'manual').length})
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="table-wrapper">
          {/* Data Table */}
          <table className="datatable-checkin">
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    <span className="th-icon">👤</span>
                    <span>Thành viên</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span className="th-icon">📞</span>
                    <span>Số điện thoại</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span className="th-icon">⏰</span>
                    <span>Thời gian</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span className="th-icon">📱</span>
                    <span>Nguồn</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span className="th-icon">💪</span>
                    <span>Gói tập</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span className="th-icon">⚙️</span>
                    <span>Thao tác</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="datatable-empty">
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <div className="empty-text">Không có dữ liệu check-in</div>
                      <div className="empty-hint">Hãy thử thay đổi bộ lọc hoặc kiểm tra lại kết nối</div>
                    </div>
                  </td>
                </tr>
              ) : (
                checkins.map((checkin, index) => (
                  <tr key={checkin.id} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                    <td className="member-cell">
                      <div className="member-name">{checkin.memberName || 'Không rõ tên'}</div>
                    </td>
                    <td className="phone-cell">
                      <div className="phone-wrapper">
                        <span className="phone-number">{checkin.memberPhone || '-'}</span>
                      </div>
                    </td>
                    <td className="time-cell">
                      <div className="time-wrapper">
                        <span className="time-value">{formatDateTime(checkin.checkedAt)}</span>
                      </div>
                    </td>
                    <td className="source-cell">
                      <span className={`source-badge ${checkin.source === 'QR' ? 'source-qr' : 'source-manual'}`}>
                        <span className="source-icon">
                          {checkin.source === 'QR' ? '📱' : '✋'}
                        </span>
                        <span className="source-text">
                          {checkin.source === 'QR' ? 'QR Code' : 'Thủ công'}
                        </span>
                      </span>
                    </td>
                    <td className="package-cell">
                      <span className="package-name">{checkin.packageId || '-'}</span>
                    </td>
                    <td className="action-cell">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditCheckin(checkin)}
                        title="Sửa thời gian check-in"
                      >
                        <span className="edit-icon">✏️</span>
                        <span className="edit-text">Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Section */}
        {hasMore && (
          <div className="load-more-section">
            <div className="load-more-decoration">
              <div className="decoration-line"></div>
              <div className="decoration-text">Còn nhiều dữ liệu hơn</div>
              <div className="decoration-line"></div>
            </div>
            <button 
              className="load-more-btn" 
              onClick={handleLoadMore} 
              disabled={loadingMore}
            >
              <div className="btn-content">
                <span className="btn-icon">
                  {loadingMore ? '⏳' : '📥'}
                </span>
                <span className="btn-text">
                  {loadingMore ? 'Đang tải dữ liệu...' : 'Tải thêm check-in'}
                </span>
                {!loadingMore && <span className="btn-arrow">↓</span>}
              </div>
              {loadingMore && (
                <div className="loading-progress">
                  <div className="progress-bar"></div>
                </div>
              )}
            </button>
          </div>
        )}

        {/* No More Data Message */}
        {!hasMore && checkins.length > 0 && (
          <div className="no-more-section">
            <div className="completion-decoration">
              <div className="completion-line"></div>
              <div className="completion-icon">✅</div>
              <div className="completion-line"></div>
            </div>
            <div className="completion-text">
              <div className="completion-title">Đã hiển thị tất cả dữ liệu</div>
              <div className="completion-subtitle">Tổng cộng {checkins.length} lượt check-in</div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditCheckinModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCheckin(null);
        }}
        checkinData={selectedCheckin}
        onSave={handleSaveEdit}
        onDelete={handleDeleteFromModal}
      />
    </div>
  );
}