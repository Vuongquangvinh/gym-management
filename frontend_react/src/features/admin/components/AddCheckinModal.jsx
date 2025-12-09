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

  // Refs
  const searchTimeoutRef = useRef(null);
  const modalRef = useRef(null);

  // Provider
  const { addCheckin } = useCheckins();

  // Debounced search function
  const searchMembers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      
      // Search members by name or phone
      const filters = {
        searchQuery: query.trim()
      };
      
      console.log('Searching members with:', filters);
      const result = await UserModel.getAll(filters, 10);
      
      setSearchResults(result.users || []);
      console.log('Found members:', result.users?.length || 0);
    } catch (err) {
      console.error('Error searching members:', err);
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
  };

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
            <label htmlFor="member-search">Tìm thành viên</label>
            <div className={styles.searchContainer}>
              <input
                id="member-search"
                type="text"
                placeholder="Nhập tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
                autoComplete="off"
              />
              {isSearching && (
                <div className={styles.searchLoading}>Đang tìm...</div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map((member) => (
                  <div
                    key={member.id || member._id}
                    className={styles.searchResultItem}
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {member.full_name || member.name || 'Không có tên'}
                      </div>
                      <div className={styles.memberPhone}>
                        {member.phone_number || member.phone || 'Không có SĐT'}
                      </div>
                    </div>
                    <div className={styles.memberStatus}>
                      {member.membership_status || 'Unknown'}
                    </div>
                  </div>
                ))}
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
