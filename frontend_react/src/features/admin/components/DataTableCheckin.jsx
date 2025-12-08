
import React, { useState, useCallback, useEffect, useRef } from "react";
import styles from './DataTableCheckin.module.css';
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

  // Maintain focus after rerender
  useEffect(() => {
    if (shouldMaintainFocusRef.current && inputRef.current) {
      const input = inputRef.current;
      const cursorPosition = input.selectionStart;
      
      // Refocus và restore cursor position
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
      throw error; // Rethrow để modal có thể handle
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
      <div className={styles.checkinPage}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải dữ liệu checkin...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.checkinPage}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Có lỗi xảy ra</h3>
          <p>Lỗi: {error.message}</p>
          <button 
            className={styles.retryBtn}
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkinPage}>
      {/* Header Section */}
      <div className={styles.headerContent}>
        <div className={styles.headerMain}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Quản lý Checkin</h1>
            <p className={styles.pageSubtitle}>Theo dõi và quản lý lịch sử checkin của thành viên</p>
          </div>
          {onAddCheckin && (
            <div className={styles.headerActions}>
              <button 
                className={styles.addCheckinBtn}
                onClick={onAddCheckin}
                title="Thêm checkin mới"
              >
                <span className={styles.btnIcon}>➕</span>
                <span className={styles.btnText}>Thêm checkin</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStatsCheckins}>
        <div className={styles.statCardCheckins}>
          <div className={styles.statHeaderCheckins}>
            <div className={styles.statTitleCheckins}>Check-ins hiện tại</div>
            <div className={styles.statIconCheckins}>👥</div>
          </div>
          <div className={styles.statValueCheckins}>{checkins.length}</div>
          <div className={styles.statDescriptionCheckins}>Tổng số lượt checkin</div>
        </div>

        <div className={styles.statCardCheckins}>
          <div className={styles.statHeaderCheckins}>
            <div className={styles.statTitleCheckins}>Hôm nay</div>
            <div className={styles.statIconCheckins}>🕐</div>
          </div>
          <div className={styles.statValueCheckins}>
            {checkins.filter(c => {
              const today = new Date();
              const checkinDate = c.checkedAt?.toDate ? c.checkedAt.toDate() : new Date(c.checkedAt);
              return checkinDate.toDateString() === today.toDateString();
            }).length}
          </div>
          <div className={styles.statDescriptionCheckins}>Checkin trong ngày</div>
        </div>

        <div className={styles.statCardCheckins}>
          <div className={styles.statHeaderCheckins}>
            <div className={styles.statTitleCheckins}>QR Code</div>
            <div className={styles.statIconCheckins}>📱</div>
          </div>
          <div className={styles.statValueCheckins}>
            {checkins.filter(c => c.source === 'QR').length}
          </div>
          <div className={styles.statDescriptionCheckins}>Quét QR Code</div>
        </div>
      </div>

      {/* Filters Card */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <div className={styles.filtersTitleSection}>
            <div className={styles.filtersIcon}>🔍</div>
            <h3 className={styles.filtersTitle}>Bộ lọc tìm kiếm</h3>
          </div>
          <div className={styles.filtersSummary}>
            {(searchQuery || dateFilter || sourceFilter) && (
              <span className={styles.activeFilters}>
                {[searchQuery && 'Tìm kiếm', dateFilter && 'Ngày', sourceFilter && 'Nguồn'].filter(Boolean).join(', ')} đang được áp dụng
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.filtersContent}>
          <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>👤</span>
              Tìm kiếm thành viên
            </label>
            <div className={styles.inputWrapper}>
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
                className={styles.filterInput}
              />
              <div className={styles.inputIcon}>🔍</div>
            </div>
          </div>
          
          <div className={`${styles.filterGroup} ${styles.dateGroup}`}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              Chọn ngày
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                className={styles.filterInput}
              />
              <div className={styles.inputIcon}>📅</div>
            </div>
            {dateFilter && (
              <div className={styles.filterHint}>
                Hiển thị check-in từ {new Date(dateFilter).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
          
          <div className={`${styles.filterGroup} ${styles.sourceGroup}`}>
            <label className={styles.filterLabel}>
              <span className={styles.labelIcon}>📱</span>
              Nguồn checkin
            </label>
            <div className={styles.selectWrapper}>
              <select
                value={sourceFilter}
                onChange={handleSourceChange}
                className={`${styles.filterInput} ${styles.sourceSelect}`}
              >
                <option value="">🔄 Tất cả nguồn</option>
                <option value="QR">📱 QR Code</option>
                <option value="manual">✋ Thủ công</option>
              </select>
              <div className={styles.selectArrow}>▼</div>
            </div>
            {sourceFilter && (
              <div className={styles.filterHint}>
                Chỉ hiển thị checkin từ {sourceFilter === 'QR' ? 'QR Code' : 'nhập thủ công'}
              </div>
            )}
          </div>
          
          <div className={styles.filterActions}>
            <button 
              className={`${styles.filterBtn} ${styles.secondary}`}
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
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitleSection}>
            <h3 className={styles.tableTitle}>
              <span className={styles.tableIcon}>📊</span>
              Lịch sử checkin
            </h3>
            <div className={styles.tableStats}>
              <span className={styles.totalCount}>{checkins.length} mục</span>
              <div className={styles.statusIndicators}>
                <span className={`${styles.indicator} ${styles.qrIndicator}`}>
                  <span className={styles.dot}></span>
                  QR Code ({checkins.filter(c => c.source === 'QR').length})
                </span>
                <span className={`${styles.indicator} ${styles.manualIndicator}`}>
                  <span className={styles.dot}></span>
                  Thủ công ({checkins.filter(c => c.source === 'manual').length})
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.tableWrapper}>
          {/* Data Table */}
          <table className={styles.datatableCheckin}>
            <thead>
              <tr>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>👤</span>
                    <span>Thành viên</span>
                  </div>
                </th>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>📞</span>
                    <span>Số điện thoại</span>
                  </div>
                </th>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>⏰</span>
                    <span>Thời gian</span>
                  </div>
                </th>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>📱</span>
                    <span>Nguồn</span>
                  </div>
                </th>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>💪</span>
                    <span>Gói tập</span>
                  </div>
                </th>
                <th>
                  <div className={styles.thContent}>
                    <span className={styles.thIcon}>⚙️</span>
                    <span>Thao tác</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.datatableEmpty}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📝</div>
                      <div className={styles.emptyText}>Không có dữ liệu checkin</div>
                      <div className={styles.emptyHint}>Hãy thử thay đổi bộ lọc hoặc kiểm tra lại kết nối</div>
                    </div>
                  </td>
                </tr>
              ) : (
                checkins.map((checkin, index) => (
                  <tr key={checkin.id} className={styles.tableRow}>
                    <td className={styles.memberCell}>
                      <div className={styles.memberName}>{checkin.memberName || 'Không rõ tên'}</div>
                    </td>
                    <td className={styles.phoneCell}>
                      <div className={styles.phoneWrapper}>
                        <span className={styles.phoneNumber}>{checkin.memberPhone || '-'}</span>
                      </div>
                    </td>
                    <td className={styles.timeCell}>
                      <div className={styles.timeWrapper}>
                        <span className={styles.timeValue}>{formatDateTime(checkin.checkedAt)}</span>
                      </div>
                    </td>
                    <td className={styles.sourceCell}>
                      <span className={checkin.source === 'QR' ? styles.sourceQr : styles.sourceManual}>
                        <span className={styles.sourceIcon}>
                          {checkin.source === 'QR' ? '📱' : '✋'}
                        </span>
                        <span className={styles.sourceText}>
                          {checkin.source === 'QR' ? 'QR Code' : 'Thủ công'}
                        </span>
                      </span>
                    </td>
                    <td className={styles.packageCell}>
                      <span className={styles.packageName}>{checkin.packageId || '-'}</span>
                    </td>
                    <td className={styles.actionCell}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleEditCheckin(checkin)}
                        title="Sửa thời gian checkin"
                      >
                        <span className={styles.editIcon}>✏️</span>
                        <span className={styles.editText}>Sửa</span>
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
          <div className={styles.loadMoreSection}>
            <div className={styles.loadMoreDecoration}>
              <div className={styles.decorationLine}></div>
              <div className={styles.decorationText}>Còn nhiều dữ liệu hơn</div>
              <div className={styles.decorationLine}></div>
            </div>
            <button 
              className={styles.loadMoreBtn} 
              onClick={handleLoadMore} 
              disabled={loadingMore}
            >
              <div className={styles.btnContent}>
                <span className={styles.btnIcon}>
                  {loadingMore ? '⏳' : '📥'}
                </span>
                <span className={styles.btnText}>
                  {loadingMore ? 'Đang tải dữ liệu...' : 'Tải thêm checkin'}
                </span>
                {!loadingMore && <span className={styles.btnArrow}>↓</span>}
              </div>
              {loadingMore && (
                <div className={styles.loadingProgress}>
                  <div className={styles.progressBar}></div>
                </div>
              )}
            </button>
          </div>
        )}

        {/* No More Data Message */}
        {!hasMore && checkins.length > 0 && (
          <div className={styles.noMoreSection}>
            <div className={styles.completionDecoration}>
              <div className={styles.completionLine}></div>
              <div className={styles.completionIcon}>✅</div>
              <div className={styles.completionLine}></div>
            </div>
            <div className={styles.completionText}>
              <div className={styles.completionTitle}>Đã hiển thị tất cả dữ liệu</div>
              <div className={styles.completionSubtitle}>Tổng cộng {checkins.length} lượt checkin</div>
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
