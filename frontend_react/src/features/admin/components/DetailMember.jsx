import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./DetailMember.css";

export default function DetailMember({ user, isOpen, onClose, onUpdate }) {
  if (!isOpen || !user) return null;

  const [editedUser, setEditedUser] = useState(null);
  const [editModes, setEditModes] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : '';
  const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  const handleEditToggle = (section) => {
    const newEditMode = !editModes[section];
    setEditModes(prev => ({ ...prev, [section]: newEditMode }));
    if (newEditMode && !editedUser) {
      setEditedUser({ ...user });
    }
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSave = async (section) => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      if (onUpdate && editedUser) {
        await onUpdate(editedUser);
        setEditModes(prev => ({ ...prev, [section]: false }));
        setEditedUser(null);
        setSuccessMessage("Cập nhật thông tin thành công!");
      }
    } catch (err) {
      console.log("🚀 ~ handleSave ~ err:", err)
      setErrorMessage("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.");
    }
  };

  const handleCancel = (section) => {
    setEditModes(prev => ({ ...prev, [section]: false }));
    setEditedUser(null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const getFieldValue = (field) => editedUser?.[field] ?? user[field];

  const getArrayFieldValue = (field) => {
    const val = getFieldValue(field);
    return Array.isArray(val) ? val.join(", ") : '';
  };

  const updateArrayField = (field, value) => {
    const items = value.split(",").map(item => item.trim()).filter(Boolean);
    setEditedUser(prev => ({ ...prev, [field]: items }));
  };

  const getDateValueForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Nội dung popup
  const popupContent = (
    <div className="popup-overlay">
      <div className="detailmember-card">
        <div className="detailmember-header">
          <h2>Thông tin hội viên</h2>
          <button className="detailmember-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '18px 32px 0 32px' }}>
          {successMessage && <div className="form-success">{successMessage}</div>}
          {errorMessage && <div className="form-error">{errorMessage}</div>}
        </div>
        <div className="detailmember-main-content">
          {/* Left Column */}
          <div className="detailmember-column left-column">
            {/* Avatar and Basic Info */}
            
            <div className="detailmember-profile-section">
              <div className="detailmember-avatar">
              
                  <label style={{ width: '100%' }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" />
                  ) : (
                    <div className="detailmember-avatar-placeholder">No Image</div>
                  )}</label>
              </div>
              <div className="detailmember-basic-info">
                {editModes.profile ? (
                  <>

                    
                    <input
                      type="text"
                      value={getFieldValue('full_name') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, full_name: e.target.value }))}
                      className="edit-input"
                      placeholder="Họ và tên"
                      style={{ marginBottom: 8 }}
                    />
                     <label className="field">
                    <input
                      type="email"
                      value={getFieldValue('email') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                      className="edit-input"
                      placeholder="Email"
                      style={{ marginBottom: 8 }}
                    />
                    </label>
                    <label className="field">
                    <input
                      type="text"
                      value={getFieldValue('phone_number') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="edit-input"
                      placeholder="Số điện thoại"
                      style={{ marginBottom: 8 }}
                    /></label>
                  </>
                ) : (
                  <>
                    <h3 className="detailmember-fullname">{user.full_name}</h3>
                    <p className="detailmember-role">Hội viên Gym</p>
                    <div className="detailmember-contact">
                      <div className="contact-item">
                        <span className="contact-label">Email:</span>
                        <span className="contact-value">{user.email}</span>
                      </div>
                      <div className="contact-item">
                        <span className="contact-label">SĐT:</span>
                        <span className="contact-value">{user.phone_number}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                <button className="section-edit" onClick={() => handleEditToggle('profile')}>✏️</button>
                {editModes.profile && (
                  <div className="section-actions" style={{ marginTop: 8 }}>
                    <button className="cancel-btn" onClick={() => handleCancel('profile')}>Hủy</button>
                    <button className="update-btn" onClick={() => handleSave('profile')}>Cập nhật</button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Thông tin Định danh & Liên hệ */}
            <div className="detailmember-section compact-section">
              <div className="section-header">
                <h4>1. Thông tin Định danh & Liên hệ</h4>
                <button className="section-edit" onClick={() => handleEditToggle('identification')}>✏️</button>
              </div>
              <div className="section-grid">
                <div className="grid-item">
                  <span className="item-label">Giới tính:</span>
                  {editModes.identification ? (
                      <label className="field">
                      <select 
                      value={getFieldValue('gender') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, gender: e.target.value }))} 
                      className="edit-input"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                      </label>
                  
                  ) : (
                    <span className="item-value">{getFieldValue('gender') === "male" ? "Nam" : getFieldValue('gender') === "female" ? "Nữ" : "Khác"}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Ngày sinh:</span>
                  {editModes.identification ? (
                    <label className="field">
                      <input
                        type="date"
                        value={getDateValueForInput(getFieldValue('date_of_birth'))}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="edit-input"
                      />
                    </label>
                  ) : (
                    <span className="item-value">{formatDate(getFieldValue('date_of_birth'))}</span>
                  )}
                </div>
                {/* Thêm địa chỉ nếu có
                {user.address && (
                  <div className="grid-item full-width">
                    <span className="item-label">Địa chỉ:</span>
                    {editModes.identification ? (
                      <label className="field">
                        <input
                          type="text"
                          value={getFieldValue('address') || ''}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, address: e.target.value }))}
                          className="edit-input"
                        />
                      </label>
                  ) : (
                    <span className="item-value">{formatDate(getFieldValue('date_of_birth'))}</span>
                  )}
                </div>
                {/* Thêm địa chỉ nếu có
                {user.address && (
                  <div className="grid-item full-width">
                    <span className="item-label">Địa chỉ:</span>
                    <span className="item-value">{user.address}</span>
                  </div>
                )} */}
              </div>
              {editModes.identification && (
                <div className="section-actions">
                  <button className="cancel-btn" onClick={() => handleCancel('identification')}>Hủy</button>
                  <button className="update-btn" onClick={() => handleSave('identification')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Section 3: Thông tin Sức khỏe & Mục tiêu */}
            <div className="detailmember-section compact-section">
              <div className="section-header">
                <h4>3. Thông tin Sức khỏe & Mục tiêu</h4>
                <button className="section-edit" onClick={() => handleEditToggle('health')}>✏️</button>
              </div>
              <div className="section-grid">
                <div className="grid-item full-width">
                  <span className="item-label">Mục tiêu tập luyện:</span>
                  {editModes.health ? (
                    <label className="field">
                    <textarea 
                      value={getArrayFieldValue('fitness_goal')} 
                      onChange={(e) => updateArrayField('fitness_goal', e.target.value)} 
                      className="edit-input full-width-textarea" 
                      rows={2}
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getArrayFieldValue('fitness_goal') || 'Chưa xác định'}</span>
                  )}
                </div>
                <div className="grid-item full-width">
                  <span className="item-label">Tình trạng sức khỏe:</span>
                  {editModes.health ? (
                    <label className="field">
                    <textarea 
                      value={getArrayFieldValue('medical_conditions')} 
                      onChange={(e) => updateArrayField('medical_conditions', e.target.value)} 
                      className="edit-input full-width-textarea" 
                      rows={2}
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getArrayFieldValue('medical_conditions') || 'Không có'}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Chiều cao (cm):</span>
                  {editModes.health ? (
                    <label className="field">
                    <input 
                      type="number" 
                      value={getFieldValue('initial_measurements')?.height || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, initial_measurements: { ...prev.initial_measurements, height: parseFloat(e.target.value) || 0 } }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('initial_measurements')?.height || ''}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Cân nặng (kg):</span>
                  {editModes.health ? (
                    <label className="field">
                    <input 
                      type="number" 
                      value={getFieldValue('initial_measurements')?.weight || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, initial_measurements: { ...prev.initial_measurements, weight: parseFloat(e.target.value) || 0 } }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('initial_measurements')?.weight || ''}</span>
                  )}
                </div>
              </div>
              {editModes.health && (
                <div className="section-actions">
                  <button className="cancel-btn" onClick={() => handleCancel('health')}>Hủy</button>
                  <button className="update-btn" onClick={() => handleSave('health')}>Cập nhật</button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="detailmember-column right-column">
            {/* Section 2: Thông tin Quản lý Gói tập */}
            <div className="detailmember-section compact-section">
              <div className="section-header">
                <h4>2. Thông tin Quản lý Gói tập</h4>
                <button className="section-edit" onClick={() => handleEditToggle('package')}>✏️</button>
              </div>
              <div className="section-grid">
                <div className="grid-item">
                  <span className="item-label">Gói tập hiện tại:</span>
                  {editModes.package ? (
                    <label className="field">
                    <input 
                      type="text" 
                      value={getFieldValue('current_package_id') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, current_package_id: e.target.value }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('current_package_id') || 'Chưa có'}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Trạng thái thành viên:</span>
                  {editModes.package ? (
                   <label className="field">
                      <select
                        value={getFieldValue('membership_status') || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, membership_status: e.target.value }))}
                        className="edit-input"
                      >
                        <option value="">Chọn trạng thái</option>
                        <option value="Active">Hoạt động</option>
                        <option value="Expired">Hết hạn</option>
                        <option value="Frozen">Tạm dừng</option>
                        <option value="Trial">Dùng thử</option>
                      </select>
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('membership_status') || 'Hoạt động'}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Ngày hết hạn:</span>
                  {editModes.package ? (
                    <label className="field">
                    <input 
                      type="date" 
                      value={getDateValueForInput(getFieldValue('package_end_date'))} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, package_end_date: e.target.value }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{formatDate(getFieldValue('package_end_date'))}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Số buổi còn lại:</span>
                  {editModes.package ? (
                    <label className="field">
                    <input 
                      type="number" 
                      value={getFieldValue('remaining_sessions') ?? ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, remaining_sessions: parseInt(e.target.value) || 0 }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('remaining_sessions') !== null && getFieldValue('remaining_sessions') !== undefined ? getFieldValue('remaining_sessions') : ''}</span>
                  )}
                </div>
              
              </div>
              {editModes.package && (
                <div className="section-actions">
                  <button className="cancel-btn" onClick={() => handleCancel('package')}>Hủy</button>
                  <button className="update-btn" onClick={() => handleSave('package')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Section 4: Thông tin Hệ thống & Nội bộ */}
            <div className="detailmember-section compact-section">
              <div className="section-header">
                <h4>4. Thông tin Hệ thống & Nội bộ</h4>
                <button className="section-edit" onClick={() => handleEditToggle('system')}>✏️</button>
              </div>
              <div className="section-grid">
                <div className="grid-item">
                  <span className="item-label">Ngày đăng ký:</span>
                  {editModes.system ? (
                      <label className="field">
                    <input 
                      type="date" 
                      value={getDateValueForInput(getFieldValue('join_date'))} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, join_date: e.target.value }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{formatDate(getFieldValue('join_date'))}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Nhân viên phụ trách:</span>
                  {editModes.system ? (
                      <label className="field">
                    <input 
                      type="text" 
                      value={getFieldValue('assigned_staff_id') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, assigned_staff_id: e.target.value }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('assigned_staff_id') || 'Chưa chỉ định'}</span>
                  )}
                </div>
                <div className="grid-item">
                  <span className="item-label">Nguồn Lead:</span>
                  {editModes.system ? (
                    <label className="field">
                    <input 
                      type="text" 
                      value={getFieldValue('lead_source') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, lead_source: e.target.value }))} 
                      className="edit-input" 
                    />
                    </label>
                  ) : (
                    <span className="item-value">{getFieldValue('lead_source') || 'Không xác định'}</span>
                  )}
                </div>
                {user.branch_id && (
                  <div className="grid-item">
                    <span className="item-label">Chi nhánh:</span>
                    {editModes.system ? (
                      <label className="field">
                      <input 
                        type="text" 
                        value={getFieldValue('branch_id') || ''} 
                        onChange={(e) => setEditedUser(prev => ({ ...prev, branch_id: e.target.value }))} 
                        className="edit-input" 
                      />
                      </label>
                      
                    ) : (
                      <span className="item-value">{getFieldValue('branch_id')}</span>
                    )}
                  </div>
                )}
                <div className="grid-item full-width">
                  <span className="item-label">Check-in gần nhất:</span>
                  <span className="item-value">{formatDateTime(getFieldValue('last_checkin_time'))}</span>
                </div>
                <div className="grid-item full-width">
                  <span className="item-label">Lịch sử tạm dừng:</span>
                  <span className="item-value">
                    {getFieldValue('frozen_history') && getFieldValue('frozen_history').length ? 
                      getFieldValue('frozen_history').map((item, idx) => (
                        <div key={idx} className="history-item">
                          {formatDate(item.start)} - {formatDate(item.end)}
                        </div>
                      )) : "Không có"}
                  </span>
                </div>
              </div>
              {editModes.system && (
                <div className="section-actions">
                  <button className="cancel-btn" onClick={() => handleCancel('system')}>Hủy</button>
                  <button className="update-btn" onClick={() => handleSave('system')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Audit Info */}
            <div className="detailmember-audit compact-audit">
              <div className="audit-item">
                <span className="audit-label">Ngày tạo:</span>
                <span className="audit-value">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="audit-item">
                <span className="audit-label">Ngày cập nhật:</span>
                <span className="audit-value">{formatDateTime(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popupContent, document.body);
}