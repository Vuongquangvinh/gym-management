import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCheckins } from '../../../firebase/lib/features/checkin/checkin.provier.jsx';
import { UserModel } from '../../../firebase/lib/features/user/user.model.js';
import { toast } from 'react-toastify';
import './AddCheckinModal.css';

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
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMember(null);
    setCheckinTime(new Date().toISOString().slice(0, 16));
    setError('');
    setIsSearching(false);
    setIsSaving(false);
    onClose();
  };

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
  }, [isOpen]);

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
    <div className="add-checkin-modal-overlay" onClick={handleOverlayClick}>
      <div className="add-checkin-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Thêm Check-in</h2>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Member Search */}
          <div className="form-group">
            <label htmlFor="member-search">Tìm thành viên</label>
            <div className="search-container">
              <input
                id="member-search"
                type="text"
                placeholder="Nhập tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
                autoComplete="off"
              />
              {isSearching && (
                <div className="search-loading">Đang tìm...</div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((member) => (
                  <div
                    key={member.id || member._id}
                    className="search-result-item"
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className="member-info">
                      <div className="member-name">
                        {member.full_name || member.name || 'Không có tên'}
                      </div>
                      <div className="member-phone">
                        {member.phone_number || member.phone || 'Không có SĐT'}
                      </div>
                    </div>
                    <div className="member-status">
                      {member.membership_status || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Member Display */}
            {selectedMember && (
              <div className="selected-member">
                <div className="selected-label">Đã chọn:</div>
                <div className="selected-info">
                  <span className="selected-name">
                    {selectedMember.full_name || selectedMember.name}
                  </span>
                  <span className="selected-phone">
                    {selectedMember.phone_number || selectedMember.phone}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Check-in Time */}
          <div className="form-group">
            <label htmlFor="checkin-time">Thời gian check-in</label>
            <input
              id="checkin-time"
              type="datetime-local"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="time-input"
              max={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
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