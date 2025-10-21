import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase/lib/config/firebase';
import { createCheckin } from '../../../firebase/lib/features/checkin/checkin.service';
import './QuickCheckinModal.css';

export default function QuickCheckinModal({ onClose, onSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  // Search members
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersRef = collection(db, 'users');
        
        // Search by name or phone
        const nameQuery = query(
          usersRef,
          where('full_name', '>=', searchTerm),
          where('full_name', '<=', searchTerm + '\uf8ff'),
          where('isActive', '==', true),
          limit(10)
        );
        
        const phoneQuery = query(
          usersRef,
          where('phone_number', '>=', searchTerm),
          where('phone_number', '<=', searchTerm + '\uf8ff'),
          where('isActive', '==', true),
          limit(10)
        );

        const [nameSnapshot, phoneSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(phoneQuery)
        ]);

        const resultsMap = new Map();
        
        nameSnapshot.docs.forEach(doc => {
          const data = doc.data();
          resultsMap.set(doc.id, { id: doc.id, ...data });
        });
        
        phoneSnapshot.docs.forEach(doc => {
          const data = doc.data();
          resultsMap.set(doc.id, { id: doc.id, ...data });
        });

        const results = Array.from(resultsMap.values());
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching members:', err);
        setError('Lỗi tìm kiếm thành viên');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchMembers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchResults([]);
  };

  const handleCheckin = async () => {
    if (!selectedMember) return;

    setChecking(true);
    setError(null);

    try {
      // Kiểm tra membership status
      if (selectedMember.membership_status !== 'Active') {
        throw new Error('Thành viên này không còn active. Vui lòng gia hạn gói tập.');
      }

      // Kiểm tra package còn hạn
      const packageEndDate = selectedMember.package_end_date?.toDate?.() || 
                            new Date(selectedMember.package_end_date);
      
      if (packageEndDate < new Date()) {
        throw new Error('Gói tập đã hết hạn. Vui lòng gia hạn.');
      }

      // Tạo check-in
      const checkinData = {
        userId: selectedMember._id,
        memberName: selectedMember.full_name,
        packageId: selectedMember.current_package_id,
        source: 'MANUAL',
        checkedAt: new Date(),
      };

      await createCheckin(checkinData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err.message || 'Không thể check-in. Vui lòng thử lại.');
    } finally {
      setChecking(false);
    }
  };

  const getMembershipStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return '#22c55e';
      case 'Expired':
        return '#ef4444';
      case 'Frozen':
        return '#3b82f6';
      case 'Trial':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚡ Check-in nhanh</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!selectedMember ? (
            <>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {loading && <span className="search-loading">🔍</span>}
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="member-item"
                      onClick={() => handleSelectMember(member)}
                    >
                      <div className="member-info">
                        <div className="member-name">{member.full_name}</div>
                        <div className="member-phone">{member.phone_number}</div>
                      </div>
                      <div 
                        className="member-status"
                        style={{ 
                          color: getMembershipStatusColor(member.membership_status),
                          fontWeight: 600
                        }}
                      >
                        {member.membership_status}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && !loading && searchResults.length === 0 && (
                <p className="no-results">Không tìm thấy thành viên nào</p>
              )}
            </>
          ) : (
            <>
              <div className="selected-member">
                <div className="member-card">
                  <div className="member-avatar">
                    {selectedMember.avatar_url ? (
                      <img src={selectedMember.avatar_url} alt={selectedMember.full_name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedMember.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="member-details">
                    <h4>{selectedMember.full_name}</h4>
                    <p>📞 {selectedMember.phone_number}</p>
                    <p>📧 {selectedMember.email || 'Chưa có email'}</p>
                    <p>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getMembershipStatusColor(selectedMember.membership_status) + '20',
                          color: getMembershipStatusColor(selectedMember.membership_status),
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {selectedMember.membership_status}
                      </span>
                    </p>
                    {selectedMember.package_end_date && (
                      <p className="package-info">
                        Gói tập hết hạn:{' '}
                        {(selectedMember.package_end_date?.toDate?.() || 
                          new Date(selectedMember.package_end_date)).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  className="btn-change"
                  onClick={() => {
                    setSelectedMember(null);
                    setSearchTerm('');
                  }}
                >
                  ↻ Chọn người khác
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>

        {selectedMember && (
          <div className="modal-footer">
            <button className="btn outline" onClick={onClose}>
              Hủy
            </button>
            <button
              className="btn primary"
              onClick={handleCheckin}
              disabled={checking}
            >
              {checking ? '⏳ Đang check-in...' : '✓ Xác nhận check-in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
