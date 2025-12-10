import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCheckins } from '../../../firebase/lib/features/checkin/index.js';
import { UserModel } from "../../../firebase/lib/features/user/user.model.js";import { toast } from 'react-toastify';
import styles from './AddCheckinModal.module.css';

export default function AddCheckinModal({ isOpen, onClose }) {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [checkinTime, setCheckinTime] = useState(new Date().toISOString().slice(0, 16));
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs
  const searchTimeoutRef = useRef(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Provider
  const { addCheckin } = useCheckins();

  // Debounced search function
  const searchMembers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      setHasSearched(true);
      
      // Search members by name, phone, or email
      const filters = {
        searchQuery: query.trim()
      };
      
      console.log('🔍 Searching members with:', filters);
      const result = await UserModel.getAll(filters, 20); // Increase limit to 20
      
      // Sort by membership status (Active first)
      const sortedResults = (result.users || []).sort((a, b) => {
        if (a.membership_status === 'Active' && b.membership_status !== 'Active') return -1;
        if (a.membership_status !== 'Active' && b.membership_status === 'Active') return 1;
        return 0;
      });
      
      setSearchResults(sortedResults);
      setFocusedIndex(-1);
      console.log('✅ Found members:', sortedResults.length);
    } catch (err) {
      console.error('❌ Error searching members:', err);
      setError('Lỗi tìm kiếm thành viên');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedMember(null); // Clear selection when search changes

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchMembers(value);
    }, 300);
  }, [searchMembers]);

  // Handle member selection
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name || member.name || '');
    setSearchResults([]);
    setHasSearched(false);
    setFocusedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleMemberSelect(searchResults[focusedIndex]);
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setFocusedIndex(-1);
    }
  }, [searchResults, focusedIndex]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) {
      setError('Vui lòng chọn thành viên');
      return;
    }

    if (!checkinTime) {
      setError('Vui lòng chọn thời gian check-in');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // ✅ Kiểm tra membership status
      if (selectedMember.membership_status !== 'Active') {
        throw new Error('Thành viên này không còn active. Vui lòng gia hạn gói tập trước khi check-in.');
      }

      // ✅ Kiểm tra gói tập còn hạn
      if (selectedMember.package_end_date) {
        const packageEndDate = selectedMember.package_end_date?.toDate?.() || 
                              new Date(selectedMember.package_end_date);
        
        if (packageEndDate < new Date()) {
          throw new Error('Gói tập đã hết hạn. Vui lòng gia hạn trước khi check-in.');
        }
      } else {
        throw new Error('Thành viên chưa có gói tập. Vui lòng đăng ký gói tập trước khi check-in.');
      }

      const checkinData = {
        memberId: selectedMember.id || selectedMember._id,
        memberName: selectedMember.full_name || selectedMember.name || '',
        memberPhone: selectedMember.phone_number || selectedMember.phone || '',
        checkedAt: new Date(checkinTime).toISOString(),
        source: 'manual',
        packageId: selectedMember.current_package_id || ''
      };

      console.log('Creating checkin:', checkinData);
      await addCheckin(checkinData);
      
      // Hiển thị thông báo thành công
      toast.success(`Check-in thành công cho ${selectedMember.full_name || selectedMember.name}!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Reset form and close modal
      handleClose();
    } catch (err) {
      console.error('Error creating checkin:', err);
      setError('Lỗi tạo check-in: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal close
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMember(null);
    setCheckinTime(new Date().toISOString().slice(0, 16));
    setError('');
    setIsSearching(false);
    setIsSaving(false);
    setHasSearched(false);
    setFocusedIndex(-1);
    onClose();
  }, [onClose]);

  // Handle click outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.addCheckinModalOverlay} onClick={handleOverlayClick}>
      <div className={styles.addCheckinModal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2>Thêm Check-in</h2>
          <button 
            className={styles.modalCloseBtn}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Member Search */}
          <div className={styles.formGroup}>
            <label htmlFor="member-search">
              Tìm thành viên <span style={{color: '#ef4444'}}>*</span>
            </label>
            <div className={styles.searchContainer}>
              <input
                ref={searchInputRef}
                id="member-search"
                type="text"
                placeholder="Nhập tên, số điện thoại hoặc email..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className={styles.searchInput}
                autoComplete="off"
                autoFocus
              />
              {isSearching && (
                <div className={styles.searchLoading}>
                  <span className={styles.spinner}></span>
                  Đang tìm...
                </div>
              )}
              {!isSearching && searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
                    setSelectedMember(null);
                    searchInputRef.current?.focus();
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <div className={styles.searchResultsHeader}>
                  Tìm thấy {searchResults.length} thành viên
                </div>
                {searchResults.map((member, index) => {
                  const packageEndDate = member.package_end_date?.toDate?.() || 
                    (member.package_end_date ? new Date(member.package_end_date) : null);
                  const daysLeft = packageEndDate ? 
                    Math.ceil((packageEndDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <div
                      key={member.id || member._id}
                      className={`${styles.searchResultItem} ${focusedIndex === index ? styles.focused : ''}`}
                      onClick={() => handleMemberSelect(member)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>
                          {member.full_name || member.name || 'Không có tên'}
                        </div>
                        <div className={styles.memberDetails}>
                          <span className={styles.memberPhone}>
                            📱 {member.phone_number || member.phone || 'N/A'}
                          </span>
                          {member.email && (
                            <span className={styles.memberEmail}>
                              • {member.email}
                            </span>
                          )}
                        </div>
                        {member.current_package_name && (
                          <div className={styles.memberPackage}>
                            🎫 {member.current_package_name}
                            {packageEndDate && (
                              <span className={styles.packageExpiry} style={{
                                color: daysLeft <= 7 ? '#ef4444' : daysLeft <= 14 ? '#f59e0b' : '#22c55e'
                              }}>
                                {' • '}{daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.memberStatusBadge}>
                        <span 
                          className={`${styles.statusBadge} ${
                            member.membership_status === 'Active' ? styles.statusActive :
                            member.membership_status === 'Expired' ? styles.statusExpired :
                            styles.statusInactive
                          }`}
                        >
                          {member.membership_status === 'Active' ? '✓ Active' :
                           member.membership_status === 'Expired' ? '✗ Expired' :
                           member.membership_status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {hasSearched && !isSearching && searchResults.length === 0 && searchQuery.trim() && (
              <div className={styles.searchEmpty}>
                <div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyText}>
                  Không tìm thấy thành viên nào
                </div>
                <div className={styles.emptyHint}>
                  Thử tìm bằng tên, số điện thoại hoặc email khác
                </div>
              </div>
            )}

            {/* Selected Member Display */}
            {selectedMember && (
              <div className={styles.selectedMember}>
                <div className={styles.selectedLabel}>Đã chọn:</div>
                <div className={styles.selectedInfo}>
                  <span className={styles.selectedName}>
                    {selectedMember.full_name || selectedMember.name}
                  </span>
                  <span className={styles.selectedPhone}>
                    {selectedMember.phone_number || selectedMember.phone}
                  </span>
                  <span 
                    className={styles.selectedStatus}
                    style={{ 
                      color: selectedMember.membership_status === 'Active' ? '#22c55e' : 
                             selectedMember.membership_status === 'Expired' ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    {selectedMember.membership_status || 'Unknown'}
                  </span>
                  {selectedMember.package_end_date && (
                    <span className={styles.selectedExpiry}>
                      Hết hạn: {(selectedMember.package_end_date?.toDate?.() || 
                        new Date(selectedMember.package_end_date)).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Check-in Time */}
          <div className={styles.formGroup}>
            <label htmlFor="checkin-time">Thời gian check-in</label>
            <input
              id="checkin-time"
              type="datetime-local"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className={styles.timeInput}
              max={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleClose}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!selectedMember || isSaving}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
