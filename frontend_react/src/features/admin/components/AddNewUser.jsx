import React, { useState, useEffect } from 'react';
import { PackageModel } from '../../../firebase/lib/features/package/packages.model.js';
import { SpendingUserModel } from '../../../firebase/lib/features/user/spendingUser.model.js';
import styles from './AddNewuser.module.css';

export default function AddNewUser({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    avatar_url: "",
    date_of_birth: "",
    gender: "other",
    membership_status: "Active",
    current_package_id: "",
    package_name: "",
    package_price: "",
    package_duration: "",
    package_end_date: "",
    join_date: new Date().toISOString().split('T')[0],
    assigned_staff_id: "",
    fitness_goal: "",
    medical_conditions: "",
    weight: "",
    height: "",
    lead_source: "",
  });
  
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const activePackages = await PackageModel.getAll({ status: 'active' });
      setPackages(activePackages);
    } catch (err) {
      console.error('Lỗi khi load packages:', err);
      setError('Không thể tải danh sách gói tập');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePackageChange = (e) => {
    const packageId = e.target.value;

    if (packageId) {
      const pkg = packages.find(p => p.PackageId === packageId);
      setSelectedPackage(pkg);

      // Calculate final price with discount
      const finalPrice = pkg.Discount 
        ? pkg.Price * (1 - pkg.Discount / 100)
        : pkg.Price;

      if (pkg && form.join_date) {
        const startDate = new Date(form.join_date);
        const endDate = pkg.calculateEndDate(startDate);
        setForm(prev => ({
          ...prev,
          current_package_id: packageId,
          package_name: pkg.PackageName,
          package_price: Math.round(finalPrice),
          package_duration: pkg.Duration,
          package_end_date: endDate.toISOString().split('T')[0]
        }));
      } else {
        setForm(prev => ({ 
          ...prev, 
          current_package_id: packageId,
          package_name: pkg.PackageName,
          package_price: Math.round(finalPrice),
          package_duration: pkg.Duration
        }));
      }
    } else {
      setSelectedPackage(null);
      setForm(prev => ({ 
        ...prev, 
        current_package_id: "",
        package_name: "",
        package_price: "",
        package_duration: "",
        package_end_date: "" 
      }));
    }
  };

  const handleJoinDateChange = (e) => {
    const joinDate = e.target.value;
    setForm(prev => ({ ...prev, join_date: joinDate }));

    if (selectedPackage && joinDate) {
      const startDate = new Date(joinDate);
      const endDate = selectedPackage.calculateEndDate(startDate);
      setForm(prev => ({
        ...prev,
        package_end_date: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.full_name || !form.phone_number || !form.date_of_birth || !form.gender || 
        !form.membership_status || !form.current_package_id || !form.package_end_date || !form.join_date) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    setIsLoading(true);
    try {
      const initial_measurements = {};
      if (form.weight) initial_measurements.weight = parseFloat(form.weight);
      if (form.height) initial_measurements.height = parseFloat(form.height);

      const userData = {
        full_name: form.full_name,
        phone_number: form.phone_number,
        email: form.email,
        avatar_url: form.avatar_url,
        date_of_birth: new Date(form.date_of_birth),
        gender: form.gender,
        membership_status: form.membership_status,
        current_package_id: form.current_package_id,
        package_name: form.package_name,
        package_price: form.package_price,
        package_duration: form.package_duration,
        package_end_date: new Date(form.package_end_date),
        join_date: new Date(form.join_date),
        assigned_staff_id: form.assigned_staff_id,
        lead_source: form.lead_source,
        fitness_goal: form.fitness_goal ? form.fitness_goal.split(',').map(s => s.trim()) : [],
        medical_conditions: form.medical_conditions ? form.medical_conditions.split(',').map(s => s.trim()) : [],
        initial_measurements: initial_measurements,
        isActive: true,
      };

      if (onSubmit) {
        await onSubmit(userData);
        // Kh�ng c?n set success message ? d�y v� s? redirect ngay
      } else {
        await SpendingUserModel.create(userData);
        setSuccessMessage("Hội viên đã được tạo thành công!");
        
        setTimeout(() => {
          setForm({
            full_name: "",
            phone_number: "",
            email: "",
            avatar_url: "",
            date_of_birth: "",
            gender: "other",
            membership_status: "Active",
            current_package_id: "",
            package_name: "",
            package_price: "",
            package_duration: "",
            package_end_date: "",
            join_date: new Date().toISOString().split('T')[0],
            assigned_staff_id: "",
            fitness_goal: "",
            medical_conditions: "",
            weight: "",
            height: "",
            lead_source: "",
          });
          setSelectedPackage(null);
          setSuccessMessage("");
          onClose();
        }, 1500);
      }

    } catch (err) {
      console.error("Lỗi tạo người dùng:", err);
      setError("Lỗi: " + (err.message || "Không thể tạo người dùng"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.addnewuserCard}>
        <div className={styles.addnewuserBrand}>
          <div className={styles.addnewuserLogo}>REPS</div>
          <div className={styles.addnewuserBrandText}>
            <h1>Thêm Hội Viên Mới</h1>
            <p>Nhập thông tin để tạo tài khoản hội viên</p>
          </div>
        </div>
        
        <form className={styles.addnewuserForm} onSubmit={handleSubmit} noValidate>
          {successMessage && (
            <div className={styles.formSuccess}>
              {successMessage}
            </div>
          )}
          {error && <div className={styles.formError}>{error}</div>}
          
          <div className={styles.addnewuserFormRow}>
            <div className={styles.addnewuserFormCol}>
              <label className={styles.field}>
                <span>Họ và tên *</span>
                <input 
                  name="full_name" 
                  value={form.full_name} 
                  onChange={handleChange} 
                  placeholder="Nguyễn Văn A"
                  required 
                />
              </label>

              <label className={styles.field}>
                <span>Số điện thoại *</span>
                <input 
                  name="phone_number" 
                  value={form.phone_number} 
                  onChange={handleChange}
                  placeholder="0987654321"
                  required 
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input 
                  name="email" 
                  type="email"
                  value={form.email} 
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </label>

              <label className={styles.field}>
                <span>Ngày sinh *</span>
                <input 
                  name="date_of_birth" 
                  type="date" 
                  value={form.date_of_birth} 
                  onChange={handleChange} 
                  required 
                />
              </label>

              <label className={styles.field}>
                <span>Giới tính *</span>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
            </div>

            <div className={styles.addnewuserFormCol}>
              <label className={styles.field}>
                <span>Ngày tham gia *</span>
                <input 
                  name="join_date" 
                  type="date" 
                  value={form.join_date} 
                  onChange={handleJoinDateChange} 
                  required 
                />
              </label>

              <label className={styles.field}>
                <span>Gói tập *</span>
                {loadingPackages ? (
                  <div style={{ padding: '10px' }}>Đang tải gói tập...</div>
                ) : (
                  <select 
                    name="current_package_id" 
                    value={form.current_package_id} 
                    onChange={handlePackageChange} 
                    required
                  >
                    <option value="">-- Chọn gói tập --</option>
                    {packages.map((pkg) => (
                      <option key={pkg.PackageId} value={pkg.PackageId}>
                        {pkg.PackageName} - {pkg.getFinalPrice().toLocaleString('vi-VN')}d 
                        ({pkg.Duration} ngay)
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {selectedPackage && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginTop: '-10px',
                  marginBottom: '10px'
                }}>
                  <p style={{ margin: '2px 0' }}>
                    {selectedPackage.PackageType === 'time' ? 'Theo thời gian' : 'Theo buổi'}
                  </p>
                  {selectedPackage.PackageType === 'session' && (
                    <p style={{ margin: '2px 0' }}>
                      {selectedPackage.NumberOfSession} buổi
                    </p>
                  )}
                  {selectedPackage.Discount > 0 && (
                    <p style={{ margin: '2px 0', color: '#ff6b6b' }}>
                      Giảm {selectedPackage.Discount}%
                    </p>
                  )}
                </div>
              )}

              <label className={styles.field}>
                <span>Ngày hết hạn gói *</span>
                <input 
                  name="package_end_date" 
                  type="date" 
                  value={form.package_end_date} 
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                  title="Tự động tính dựa trên gói tập đã chọn"
                  required 
                />
              </label>

              <label className={styles.field}>
                <span>Trạng thái gói tập *</span>
                <select name="membership_status" value={form.membership_status} onChange={handleChange} required>
                  <option value="Active">Hoạt động</option>
                  <option value="Trial">Dùng thử</option>
                  <option value="Frozen">Tạm dừng</option>
                  <option value="Expired">Hết hạn</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Nguồn khách hàng</span>
                <select name="lead_source" value={form.lead_source} onChange={handleChange}>
                  <option value="">-- Chọn nguồn --</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Giới thiệu">Giới thiệu</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
            </div>

            <div className={styles.addnewuserFormCol}>
              <label className={styles.field}>
                <span>Nhân viên phụ trách</span>
                <input 
                  name="assigned_staff_id" 
                  value={form.assigned_staff_id} 
                  onChange={handleChange}
                  placeholder="ID nhân viên"
                />
              </label>

              <label className={styles.field}>
                <span>Mục tiêu tập luyện</span>
                <input 
                  name="fitness_goal" 
                  value={form.fitness_goal} 
                  onChange={handleChange}
                  placeholder="Giảm cân, Tăng cơ"
                />
              </label>

              <label className={styles.field}>
                <span>Vấn đề sức khỏe</span>
                <input 
                  name="medical_conditions" 
                  value={form.medical_conditions} 
                  onChange={handleChange}
                  placeholder="Bệnh tim, Tiểu đường"
                />
              </label>

              <label className={styles.field}>
                <span>Cân nặng ban đầu (kg)</span>
                <input 
                  name="weight" 
                  type="number" 
                  step="0.1"
                  value={form.weight} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: 70.5" 
                />
              </label>

              <label className={styles.field}>
                <span>Chiều cao ban đầu (cm)</span>
                <input 
                  name="height" 
                  type="number" 
                  step="0.1"
                  value={form.height} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: 175" 
                />
              </label>

              <label className={styles.field}>
                <span>Avatar URL</span>
                <input 
                  name="avatar_url" 
                  value={form.avatar_url} 
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>

          <button 
            className={`${styles.addnewuserBtn} ${styles.primary}`} 
            type="submit" 
            disabled={isLoading || loadingPackages}
          >
            {isLoading ? "Đang xử lý..." : "Thanh toán gói tập và tạo hội viên"}
          </button>

          <div className={styles.or}>hoặc</div>

          <button
            type="button" 
            className={`${styles.addnewuserBtn} ${styles.cancel}`}
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy 
          </button>
        </form>
      </div>
    </div>
  );
}
