import React, { useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

export default function CheckinModal({ 
  showModal, 
  onClose, 
  onSave, 
  members 
}) {
  const [searchMember, setSearchMember] = React.useState('');
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [checkinTime, setCheckinTime] = React.useState(new Date());

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      setSelectedMember(null);
      setCheckinTime(new Date());
      setSearchMember('');
    }
  }, [showModal]);

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchMember.trim()) return [];
    const searchTerm = searchMember.toLowerCase();
    return members.filter(member => {
      const haystack = `${member.full_name ?? ''} ${member.phone_number ?? ''}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [searchMember, members]);

  const handleSave = async () => {
    if (!selectedMember) {
      toast.error('Vui lòng chọn hội viên trước khi lưu.');
      return;
    }
    if (!checkinTime) {
      toast.error('Vui lòng chọn giờ vào trước khi lưu.');
      return;
    }

    try {
      const payload = {
        memberId: selectedMember.id,
        memberName: selectedMember.full_name,
        checkedAt: checkinTime,
        source: 'manual',
      };
      await onSave(payload);
      toast.success('Check-in thành công!');
      onClose();
    } catch (error) {
      toast.error('Lỗi khi thêm check-in. Vui lòng thử lại.');
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4 className="modal-title">Thêm Check-in</h4>
        
        <div className="modal-body">
          {/* Search Input */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm hội viên..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
            />
            
            {/* Search Results */}
            {filteredMembers.length > 0 && (
              <ul className="search-results">
                {filteredMembers.map(member => (
                  <li
                    key={member.id}
                    className="search-result-item"
                    onClick={() => {
                      setSelectedMember(member);
                      setSearchMember('');
                    }}
                  >
                    <div className="member-info">
                      <strong>{member.full_name} - {member.phone_number}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected Member Info */}
          {selectedMember && (
            <div className="selected-member">
              <h5>Thông tin hội viên</h5>
              <p><strong>Tên:</strong> {selectedMember.full_name}</p>
              <p><strong>Số điện thoại:</strong> {selectedMember.phone_number}</p>
            </div>
          )}

          {/* Time Picker */}
          <label className="time-label">Giờ vào:</label>
          <DatePicker
            selected={checkinTime}
            onChange={setCheckinTime}
            showTimeSelect
            dateFormat="Pp"
            className="time-picker"
          />
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button className="btn save-btn" onClick={handleSave}>Lưu</button>
          <button className="btn cancel-btn" onClick={onClose}>Hủy</button>
        </div>
      </div>
    </div>
  );
}

CheckinModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired
};