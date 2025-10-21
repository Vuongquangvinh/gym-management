import React, { useState, useEffect } from 'react';
import { PackageModel } from '../../../firebase/lib/features/package/packages.model.js';
import { SpendingUserModel } from '../../../firebase/lib/features/user/spendingUser.model.js';
import './AddNewuser.css';

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
      console.error('Loi khi load packages:', err);
      setError('Khong the tai danh sach goi tap');
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
      setError("Vui long nhap day du cac truong bat buoc.");
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
      } else {
        await SpendingUserModel.create(userData);
      }

      setSuccessMessage("Dang chuyen den trang thanh toan...");
      
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

    } catch (err) {
      console.error("Loi tao nguoi dung:", err);
      setError("Loi: " + (err.message || "Khong the tao nguoi dung"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="addnewuser-card">
        <div className="addnewuser-brand">
          <div className="addnewuser-logo">REPS</div>
          <div className="addnewuser-brand-text">
            <h1>Them Hoi Vien Moi</h1>
            <p>Nhap thong tin de tao tai khoan hoi vien</p>
          </div>
        </div>
        
        <form className="addnewuser-form" onSubmit={handleSubmit} noValidate>
          {successMessage && (
            <div className="form-success" style={{ 
              color: 'green', 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#d4edda',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {successMessage}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          
          <div className="addnewuser-form-row">
            <div className="addnewuser-form-col">
              <label className="field">
                <span>Ho va ten *</span>
                <input 
                  name="full_name" 
                  value={form.full_name} 
                  onChange={handleChange} 
                  placeholder="Nguyen Van A"
                  required 
                />
              </label>

              <label className="field">
                <span>So dien thoai *</span>
                <input 
                  name="phone_number" 
                  value={form.phone_number} 
                  onChange={handleChange}
                  placeholder="0987654321"
                  required 
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input 
                  name="email" 
                  type="email"
                  value={form.email} 
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </label>

              <label className="field">
                <span>Ngay sinh *</span>
                <input 
                  name="date_of_birth" 
                  type="date" 
                  value={form.date_of_birth} 
                  onChange={handleChange} 
                  required 
                />
              </label>

              <label className="field">
                <span>Gioi tinh *</span>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="male">Nam</option>
                  <option value="female">Nu</option>
                  <option value="other">Khac</option>
                </select>
              </label>
            </div>

            <div className="addnewuser-form-col">
              <label className="field">
                <span>Ngay dang ky *</span>
                <input 
                  name="join_date" 
                  type="date" 
                  value={form.join_date} 
                  onChange={handleJoinDateChange} 
                  required 
                />
              </label>

              <label className="field">
                <span>Goi tap *</span>
                {loadingPackages ? (
                  <div style={{ padding: '10px' }}>Dang tai goi tap...</div>
                ) : (
                  <select 
                    name="current_package_id" 
                    value={form.current_package_id} 
                    onChange={handlePackageChange} 
                    required
                  >
                    <option value="">-- Chon goi tap --</option>
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
                    {selectedPackage.PackageType === 'time' ? 'Theo thoi gian' : 'Theo buoi'}
                  </p>
                  {selectedPackage.PackageType === 'session' && (
                    <p style={{ margin: '2px 0' }}>
                      {selectedPackage.NumberOfSession} buoi
                    </p>
                  )}
                  {selectedPackage.Discount > 0 && (
                    <p style={{ margin: '2px 0', color: '#ff6b6b' }}>
                      Giam {selectedPackage.Discount}%
                    </p>
                  )}
                </div>
              )}

              <label className="field">
                <span>Ngay het han goi *</span>
                <input 
                  name="package_end_date" 
                  type="date" 
                  value={form.package_end_date} 
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                  title="Tu dong tinh dua tren goi tap da chon"
                  required 
                />
              </label>

              <label className="field">
                <span>Trang thai goi tap *</span>
                <select name="membership_status" value={form.membership_status} onChange={handleChange} required>
                  <option value="Active">Hoat dong</option>
                  <option value="Trial">Dung thu</option>
                  <option value="Frozen">Tam dung</option>
                  <option value="Expired">Het han</option>
                </select>
              </label>

              <label className="field">
                <span>Nguon khach hang</span>
                <select name="lead_source" value={form.lead_source} onChange={handleChange}>
                  <option value="">-- Chon nguon --</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Gioi thieu">Gioi thieu</option>
                  <option value="Khac">Khac</option>
                </select>
              </label>
            </div>

            <div className="addnewuser-form-col">
              <label className="field">
                <span>Nhan vien phu trach</span>
                <input 
                  name="assigned_staff_id" 
                  value={form.assigned_staff_id} 
                  onChange={handleChange}
                  placeholder="ID nhan vien"
                />
              </label>

              <label className="field">
                <span>Muc tieu tap luyen</span>
                <input 
                  name="fitness_goal" 
                  value={form.fitness_goal} 
                  onChange={handleChange}
                  placeholder="Giam can, Tang co"
                />
              </label>

              <label className="field">
                <span>Van de suc khoe</span>
                <input 
                  name="medical_conditions" 
                  value={form.medical_conditions} 
                  onChange={handleChange}
                  placeholder="Benh tim, Tieu duong"
                />
              </label>

              <label className="field">
                <span>Can nang ban dau (kg)</span>
                <input 
                  name="weight" 
                  type="number" 
                  step="0.1"
                  value={form.weight} 
                  onChange={handleChange} 
                  placeholder="Vi du: 70.5" 
                />
              </label>

              <label className="field">
                <span>Chieu cao ban dau (cm)</span>
                <input 
                  name="height" 
                  type="number" 
                  step="0.1"
                  value={form.height} 
                  onChange={handleChange} 
                  placeholder="Vi du: 175" 
                />
              </label>

              <label className="field">
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
            className="btn primary addnewuser-btn" 
            type="submit" 
            disabled={isLoading || loadingPackages}
          >
            {isLoading ? "Đang xử lý..." : "Thanh toán gói tập và tạo hội viên"}
          </button>

          <div className="or">hoặc</div>

          <button 
            type="button" 
            className="btn outline addnewuser-btn cancel" 
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
