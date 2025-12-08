import React, {  useState } from "react";
import ReactDOM from "react-dom";
import styles from './DetailMember.module.css';
import { PackageModel } from "../../../firebase/lib/features/package/packages.model";

export default function DetailMember({ user, isOpen, onClose, onUpdate }) {
  
  const [editedUser, setEditedUser] = useState(null);
  const [editModes, setEditModes] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showChangePackagePopup, setShowChangePackagePopup] = useState(false);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [allPackages, setAllPackages] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState("");
  const [selectedNewPackage, setSelectedNewPackage] = useState(null);
  
  // Convert several possible Firestore/JS date representations to a JS Date
  const toDateObject = (value) => {
    if (!value) return null;
    // Firestore Timestamp (has toDate())
    if (typeof value.toDate === 'function') return value.toDate();
    // Object with seconds/nanoseconds (sometimes returned from APIs)
    if (value && value.seconds !== undefined && value.nanoseconds !== undefined) {
      return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
    }
    // Already a Date
    if (value instanceof Date) return value;
    // String or number
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value) => {
    const d = toDateObject(value);
    return d ? d.toLocaleDateString('vi-VN') : '';
  };

  const formatDateTime = (value) => {
    const d = toDateObject(value);
    return d ? d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
  };

  if (!isOpen || !user) return null;
  console.log("🚀 ~ DetailMember ~ user:", user)

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

  const handleOpenChangePackage = async () => {
    setShowChangePackagePopup(true);
    setPkgLoading(true);
    setPkgError("");
    try {
      // Fetch selected package by current_package_id (if exists) and all packages in parallel
      const promises = [];
      if (user?.current_package_id) {
        promises.push(PackageModel.getByPackageId(user.current_package_id));
      } else {
        promises.push(Promise.resolve(null));
      }
      promises.push(PackageModel.getAll());

      const [pkg, packagesList] = await Promise.all(promises);
      setSelectedPackageDetails(pkg || null);
      setAllPackages(Array.isArray(packagesList) ? packagesList : []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu gói tập:", err);
      setPkgError("Không thể tải dữ liệu gói tập. Vui lòng thử lại.");
    } finally {
      setPkgLoading(false);
    }
  };

  const handleCloseChangePackage = () => {
    setShowChangePackagePopup(false);
    // clear loaded package data
    setSelectedPackageDetails(null);
    setAllPackages([]);
    setPkgError("");
    setPkgLoading(false);
    setSelectedNewPackage(null);
  };

  const handleSelectPackage = (pkg) => {
    // Toggle selection: if clicking the same package, deselect it
    if (selectedNewPackage?.PackageId === pkg.PackageId) {
      console.log('Deselecting package:', pkg.PackageId);
      setSelectedNewPackage(null);
    } else {
      // Select new package (automatically deselects previous one)
      console.log('Selecting package:', pkg.PackageId, 'Previous:', selectedNewPackage?.PackageId);
      setSelectedNewPackage(pkg);
    }
  };

  const handlePayment = async () => {
    if (!selectedNewPackage) {
      alert('Vui lòng chọn gói tập trước khi thanh toán');
      return;
    }

    try {
      // Calculate final price with discount if applicable
      const finalPrice = selectedNewPackage.Discount 
        ? selectedNewPackage.Price * (1 - selectedNewPackage.Discount / 100)
        : selectedNewPackage.Price;

      const res = await fetch('/api/payos/create-gym-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedNewPackage.PackageId,
          packageName: selectedNewPackage.PackageName,
          packagePrice: Math.round(finalPrice), // PayOS requires integer
          packageDuration: selectedNewPackage.Duration,
          userId: user.id || user._id,
          userName: user.full_name,
          userEmail: user.email,
          userPhone: user.phone_number,
          // Add userId to returnUrl to trigger refresh after payment
          returnUrl: `${window.location.origin}/admin/members?paymentSuccess=true&userId=${user.id || user._id}`,
          cancelUrl: `${window.location.origin}/admin/members?paymentCancelled=true`,
        }),
      });

      const data = await res.json();
      
      if (data.success && data.data && data.data.checkoutUrl) {
        // Redirect to PayOS checkout page
        window.location.href = data.data.checkoutUrl;
      } else {
        setErrorMessage(data.message || 'Có lỗi xảy ra khi tạo liên kết thanh toán.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Có lỗi xảy ra khi tạo liên kết thanh toán: ' + error.message);
    }
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

  const getDateValueForInput = (value) => {
    const d = toDateObject(value);
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Nội dung popup
  const popupContent = (
    <div className={styles['popup-overlay']}>
      <div className={styles['detailmember-card']}>
        <div className={styles['detailmember-header']}>
          <h2>Thông tin hội viên</h2>
          <button className={styles['detailmember-close']} onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '18px 32px 0 32px' }}>
          {successMessage && <div className={styles['form-success']}>{successMessage}</div>}
          {errorMessage && <div className={styles['form-error']}>{errorMessage}</div>}
        </div>
        <div className={styles['detailmember-main-content']}>
          {/* Left Column */}
          <div className={`${styles['detailmember-column']} ${styles['left-column']}`}>
            {/* Avatar and Basic Info */}
            
            <div className={styles['detailmember-profile-section']}>
              <div className={styles['detailmember-avatar']}>
              
                  <label style={{ width: '100%' }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" />
                  ) : (
                    <div className={styles['detailmember-avatar-placeholder']}>No Image</div>
                  )}</label>
              </div>
              <div className={styles['detailmember-basic-info']}>
                {editModes.profile ? (
                  <>

                    
                    <input
                      className={styles['edit-input']}
                      type="text"
                      value={getFieldValue('full_name') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Họ và tên"
                      style={{ marginBottom: 8 }}
                    />
                     <label>
                    <input
                      className={styles['edit-input']}
                      type="email"
                      value={getFieldValue('email') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      style={{ marginBottom: 8 }}
                    />
                    </label>
                    <label>
                    <input
                      className={styles['edit-input']}
                      type="text"
                      value={getFieldValue('phone_number') || ''}
                      onChange={e => setEditedUser(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="Số điện thoại"
                      style={{ marginBottom: 8 }}
                    /></label>
                  </>
                ) : (
                  <>
                    <h3 className={styles['detailmember-fullname']}>{user.full_name}</h3>
                    <p className={styles['detailmember-role']}>Hội viên Gym</p>
                    <div className={styles['detailmember-contact']}>
                      <div className={styles['contact-item']}>
                        <span className={styles['contact-label']}>Email:</span>
                        <span className={styles['contact-value']}>{user.email}</span>
                      </div>
                      <div className={styles['contact-item']}>
                        <span className={styles['contact-label']}>SĐT:</span>
                        <span className={styles['contact-value']}>{user.phone_number}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                <button className={styles['section-edit']} onClick={() => handleEditToggle('profile')}>✏️</button>
                {editModes.profile && (
                  <div className={styles['section-actions']} style={{ marginTop: 8 }}>
                    <button className={styles['cancel-btn']} onClick={() => handleCancel('profile')}>Hủy</button>
                    <button className={styles['update-btn']} onClick={() => handleSave('profile')}>Cập nhật</button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Thông tin Định danh & Liên hệ */}
            <div className={`${styles['detailmember-section']} ${styles['compact-section']}`}>
              <div className={styles['section-header']}>
                <h4>1. Thông tin Định danh & Liên hệ</h4>
                <button className={styles['section-edit']} onClick={() => handleEditToggle('identification')}>✏️</button>
              </div>
              <div className={styles['section-grid']}>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Giới tính:</span>
                  {editModes.identification ? (
                      <label>
                      <select 
                      value={getFieldValue('gender') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, gender: e.target.value }))} 
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                      </label>
                  
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('gender') === "male" ? "Nam" : getFieldValue('gender') === "female" ? "Nữ" : "Khác"}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Ngày sinh:</span>
                  {editModes.identification ? (
                    <label>
                      <input
                        type="date"
                        value={getDateValueForInput(getFieldValue('date_of_birth'))}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{formatDate(getFieldValue('date_of_birth'))}</span>
                  )}
                </div>
              </div>
              {editModes.identification && (
                <div className={styles['section-actions']}>
                  <button className={styles['cancel-btn']} onClick={() => handleCancel('identification')}>Hủy</button>
                  <button className={styles['update-btn']} onClick={() => handleSave('identification')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Section 3: Thông tin Sức khỏe & Mục tiêu */}
            <div className={`${styles['detailmember-section']} ${styles['compact-section']}`}>
              <div className={styles['section-header']}>
                <h4>3. Thông tin Sức khỏe & Mục tiêu</h4>
                <button className={styles['section-edit']} onClick={() => handleEditToggle('health')}>✏️</button>
              </div>
              <div className={styles['section-grid']}>
                <div className={`${styles['grid-item']} ${styles['full-width']}`}>
                  <span className={styles['item-label']}>Mục tiêu tập luyện:</span>
                  {editModes.health ? (
                    <label>
                    <textarea 
                      value={getArrayFieldValue('fitness_goal')} 
                      onChange={(e) => updateArrayField('fitness_goal', e.target.value)} 
                      className={`${styles['edit-input']} ${styles['full-width-textarea']}`}
                      rows={2}
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getArrayFieldValue('fitness_goal') || 'Chưa xác định'}</span>
                  )}
                </div>
                <div className={`${styles['grid-item']} ${styles['full-width']}`}>
                  <span className={styles['item-label']}>Tình trạng sức khỏe:</span>
                  {editModes.health ? (
                    <label>
                    <textarea 
                      value={getArrayFieldValue('medical_conditions')} 
                      onChange={(e) => updateArrayField('medical_conditions', e.target.value)} 
                      className={`${styles['edit-input']} ${styles['full-width-textarea']}`}
                      rows={2}
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getArrayFieldValue('medical_conditions') || 'Không có'}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Chiều cao (cm):</span>
                  {editModes.health ? (
                    <label>
                    <input 
                      className={styles['edit-input']}
                      type="number" 
                      value={getFieldValue('initial_measurements')?.height || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, initial_measurements: { ...prev.initial_measurements, height: parseFloat(e.target.value) || 0 } }))} 
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('initial_measurements')?.height || ''}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Cân nặng (kg):</span>
                  {editModes.health ? (
                    <label>
                    <input 
                      className={styles['edit-input']}
                      type="number" 
                      value={getFieldValue('initial_measurements')?.weight || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, initial_measurements: { ...prev.initial_measurements, weight: parseFloat(e.target.value) || 0 } }))} 
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('initial_measurements')?.weight || ''}</span>
                  )}
                </div>
              </div>
              {editModes.health && (
                <div className={styles['section-actions']}>
                  <button className={styles['cancel-btn']} onClick={() => handleCancel('health')}>Hủy</button>
                  <button className={styles['update-btn']} onClick={() => handleSave('health')}>Cập nhật</button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className={`${styles['detailmember-column']} ${styles['right-column']}`}>
            {/* Section 2: Thông tin Quản lý Gói tập */}
            <div className={`${styles['detailmember-section']} ${styles['compact-section']}`}>
              <div className={styles['section-header']}>
                <h4>2. Thông tin Quản lý Gói tập</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className={styles['change-package-btn']} onClick={handleOpenChangePackage}>
                    <span className={styles['btn-icon']}>📦</span>
                    <span>Thay đổi gói tập</span>
                  </button>
                 
                </div>
              </div>
              <div className={styles['section-grid']}>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Gói tập hiện tại:</span>
               
                    <span className={styles['item-value']}>{getFieldValue('current_package_id') || 'Chưa có'}</span>
                 
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Trạng thái gói tập:</span>
                  {editModes.package ? (
                   <label>
                      <select
                        className={styles['edit-input']}
                        value={getFieldValue('membership_status') || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, membership_status: e.target.value }))}
                      >
                        <option value="">Chọn trạng thái</option>
                        <option value="Active">Hoạt động</option>
                        <option value="Expired">Hết hạn</option>
                      
                      </select>
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('membership_status') || 'Hoạt động'}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Ngày hết hạn:</span>
                 
                    <span className={styles['item-value']}>{formatDate(getFieldValue('package_end_date'))}</span>
                  
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Số buổi còn lại:</span>
                 
                    <span className={styles['item-value']}>{getFieldValue('remaining_sessions') !== null && getFieldValue('remaining_sessions') !== undefined ? getFieldValue('remaining_sessions') : ''}</span>
                 
                </div>
              
              </div>
              {editModes.package && (
                <div className={styles['section-actions']}>
                  <button className={styles['cancel-btn']} onClick={() => handleCancel('package')}>Hủy</button>
                  <button className={styles['update-btn']} onClick={() => handleSave('package')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Section 4: Thông tin Hệ thống & Nội bộ */}
            <div className={`${styles['detailmember-section']} ${styles['compact-section']}`}>
              <div className={styles['section-header']}>
                <h4>4. Thông tin Hệ thống & Nội bộ</h4>
                <button className={styles['section-edit']} onClick={() => handleEditToggle('system')}>✏️</button>
              </div>
              <div className={styles['section-grid']}>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Ngày đăng ký:</span>
                  {editModes.system ? (
                      <label>
                    <input 
                      className={styles['edit-input']}
                      type="date" 
                      value={getDateValueForInput(getFieldValue('join_date'))} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, join_date: e.target.value }))} 
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{formatDate(getFieldValue('join_date'))}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Nhân viên phụ trách:</span>
                  {editModes.system ? (
                      <label>
                    <input 
                      className={styles['edit-input']}
                      type="text" 
                      value={getFieldValue('assigned_staff_id') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, assigned_staff_id: e.target.value }))} 
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('assigned_staff_id') || 'Chưa chỉ định'}</span>
                  )}
                </div>
                <div className={styles['grid-item']}>
                  <span className={styles['item-label']}>Nguồn Lead:</span>
                  {editModes.system ? (
                    <label>
                    <input 
                      className={styles['edit-input']}
                      type="text" 
                      value={getFieldValue('lead_source') || ''} 
                      onChange={(e) => setEditedUser(prev => ({ ...prev, lead_source: e.target.value }))} 
                    />
                    </label>
                  ) : (
                    <span className={styles['item-value']}>{getFieldValue('lead_source') || 'Không xác định'}</span>
                  )}
                </div>
                {user.branch_id && (
                  <div className={styles['grid-item']}>
                    <span className={styles['item-label']}>Chi nhánh:</span>
                    {editModes.system ? (
                      <label>
                      <input 
                        className={styles['edit-input']}
                        type="text" 
                        value={getFieldValue('branch_id') || ''} 
                        onChange={(e) => setEditedUser(prev => ({ ...prev, branch_id: e.target.value }))} 
                      />
                      </label>
                      
                    ) : (
                      <span className={styles['item-value']}>{getFieldValue('branch_id')}</span>
                    )}
                  </div>
                )}
                <div className={`${styles['grid-item']} ${styles['full-width']}`}>
                  <span className={styles['item-label']}>Check-in gần nhất:</span>
                  <span className={styles['item-value']}>{formatDateTime(getFieldValue('last_checkin_time'))}</span>
                </div>
                <div className={`${styles['grid-item']} ${styles['full-width']}`}>
                  <span className={styles['item-label']}>Lịch sử tạm dừng:</span>
                  <span className={styles['item-value']}>
                    {getFieldValue('frozen_history') && getFieldValue('frozen_history').length ? 
                      getFieldValue('frozen_history').map((item, idx) => (
                        <div key={idx} className={styles['history-item']}>
                          {formatDate(item.start)} - {formatDate(item.end)}
                        </div>
                      )) : "Không có"}
                  </span>
                </div>
              </div>
              {editModes.system && (
                <div className={styles['section-actions']}>
                  <button className={styles['cancel-btn']} onClick={() => handleCancel('system')}>Hủy</button>
                  <button className={styles['update-btn']} onClick={() => handleSave('system')}>Cập nhật</button>
                </div>
              )}
            </div>

            {/* Audit Info */}
            <div className={`${styles['detailmember-audit']} ${styles['compact-audit']}`}>
              <div className={styles['audit-item']}>
                <span className={styles['audit-label']}>Ngày tạo:</span>
                <span className={styles['audit-value']}>{formatDateTime(user.createdAt)}</span>
              </div>
              <div className={styles['audit-item']}>
                <span className={styles['audit-label']}>Ngày cập nhật:</span>
                <span className={styles['audit-value']}>{formatDateTime(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Package Popup */}
      {showChangePackagePopup && (
        <div className={styles['change-package-overlay']} onClick={handleCloseChangePackage}>
          <div className={styles['change-package-popup']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['change-package-header']}>
              <h3>Thay đổi gói tập</h3>
              <button className={styles['popup-close-btn']} onClick={handleCloseChangePackage}>×</button>
            </div>
            <div className={styles['change-package-content']}>
              {pkgLoading ? (
                <div 
        >
                  <p>⏳ Đang tải dữ liệu gói tập...</p>
                </div>
              ) : pkgError ? (
                <div 
        >{pkgError}</div>
              ) : (
                <>
                  {/* Current Package Summary */}
                  <div className={styles['current-package-summary']}>
                    <h4>📋 Thông tin gói hiện tại</h4>
                    <div className={styles['current-package-info']}>
                      <div className={styles['current-package-info-item']}>
                        <span className={styles['current-package-info-label']}>Gói tập</span>
                        <span className={styles['current-package-info-value']}>
                          {selectedPackageDetails?.PackageName || user.current_package_id || 'Chưa có gói'}
                        </span>
                      </div>
                      <div className={styles['current-package-info-item']}>
                        <span className={styles['current-package-info-label']}>Loại gói</span>
                        <span className={styles['current-package-info-value']}>
                          {selectedPackageDetails?.PackageType || '—'}
                        </span>
                      </div>
                      <div className={styles['current-package-info-item']}>
                        <span className={styles['current-package-info-label']}>Ngày hết hạn</span>
                        <span className={styles['current-package-info-value']}>
                          {formatDate(user.package_end_date) || 'Chưa có'}
                        </span>
                      </div>
                      <div className={styles['current-package-info-item']}>
                        <span className={styles['current-package-info-label']}>Số buổi còn lại</span>
                        <span className={styles['current-package-info-value']}>
                          {user.remaining_sessions ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Package Selection */}
                  <div className={styles['package-selection-section']}>
                    <h4>🎯 Chọn gói tập mới</h4>
                    {allPackages && allPackages.length > 0 ? (
                      <div className={styles['package-cards-grid']}>
                        {allPackages
                          .filter(pkg => pkg.Status === 'active')
                          .map((pkg) => {
                            const isCurrentPackage = pkg.PackageId === user.current_package_id;
                            const isSelected = selectedNewPackage?.PackageId === pkg.PackageId;
                            const finalPrice = pkg.getFinalPrice();
                            const hasDiscount = pkg.Discount > 0 && finalPrice < pkg.Price;

                            // Debug log
                            if (isSelected) {
                              console.log('Package marked as selected:', {
                                PackageId: pkg.PackageId,
                                PackageName: pkg.PackageName,
                                selectedPackageId: selectedNewPackage?.PackageId
                              });
                            }

                            return (
                              <div
                                key={pkg.PackageId}
                                className={`${styles['package-card']} ${isSelected ? styles['selected'] : ''} ${isCurrentPackage ? styles['current-active'] : ''}`}
                                onClick={() => handleSelectPackage(pkg)}
                              >
                                {isSelected && (
                                  <div className={styles['selected-package-indicator']}>✓</div>
                                )}
                                <div className={styles['package-card-header']}>
                                  <h5 className={styles['package-card-name']}>{pkg.PackageName}</h5>
                                  {isCurrentPackage ? (
                                    <span className={`${styles['package-card-badge']} ${styles['badge-current']}`}>Hiện tại</span>
                                  ) : hasDiscount ? (
                                    <span className={`${styles['package-card-badge']} ${styles['badge-discount']}`}>-{pkg.Discount}%</span>
                                  ) : null}
                                </div>
                                <p className={styles['package-card-type']}>{pkg.PackageType}</p>
                                <div className={styles['package-card-details']}>
                                  <div className={styles['package-detail-row']}>
                                    <span 
        >Thời hạn:</span>
                                    <span 
        >{pkg.Duration} ngày</span>
                                  </div>
                                  {pkg.NumberOfSession && (
                                    <div 
        >
                                      <span 
        >Số buổi:</span>
                                      <span 
        >{pkg.NumberOfSession} buổi</span>
                                    </div>
                                  )}
                                </div>
                                <div className={styles['package-card-price']}>
                                  {hasDiscount && (
                                    <div className={styles['package-price-original']}>
                                      {pkg.Price.toLocaleString('vi-VN')} VNĐ
                                    </div>
                                  )}
                                  <div className={styles['package-price-final']}>
                                    {finalPrice.toLocaleString('vi-VN')} VNĐ
                                  </div>
                                  {hasDiscount && pkg.EndDayDiscount && (
                                    <div className={styles['package-price-discount-info']}>
                                      Giảm giá đến {formatDate(pkg.EndDayDiscount)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className={styles['no-packages-message']}>
                        <div>📦</div>
                        <p>Không có gói tập nào khả dụng</p>
                      </div>
                    )}
                  </div>

                  {/* Line 849 omitted */}
                  <div className={styles['package-popup-actions']}>
                    <button 
                      className={`${styles['package-action-btn']} ${styles['btn-cancel-action']}`}
                      onClick={handleCloseChangePackage}
                    >
                      <span>❌</span>
                      <span>Hủy</span>
                    </button>
                    <button 
                      className={`${styles['package-action-btn']} ${styles['btn-payment']}`}
                      onClick={handlePayment}
                      disabled={!selectedNewPackage}
                    >
                      <span>💳</span>
                      <span>Thanh toán</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(popupContent, document.body);
}

