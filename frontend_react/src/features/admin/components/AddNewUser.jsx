import React, { useState } from 'react';
import './AddNewuser.css';

export default function AddNewUser({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    avatar_url: "",
    date_of_birth: "",
    gender: "other",
    membership_status: "Active",
    current_package_id: "",
    package_end_date: "",
    join_date: "",
    assigned_staff_id: "",
    fitness_goal: "",
    medical_conditions: "",
    // THAY ĐỔI 1: Thêm weight và height, xóa initial_measurements
    weight: "",
    height: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    // Validate các trường bắt buộc
    if (!form.full_name || !form.phone_number || !form.date_of_birth || !form.gender || !form.membership_status || !form.current_package_id || !form.package_end_date || !form.join_date) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    setIsLoading(true);
    try {
      // THAY ĐỔI 3: Tạo đối tượng measurements từ state
      const initial_measurements = {};
      if (form.weight) initial_measurements.weight = parseFloat(form.weight);
      if (form.height) initial_measurements.height = parseFloat(form.height);

      await onSubmit({
        _id: "", // sẽ được tạo tự động
        full_name: form.full_name,
        phone_number: form.phone_number,
        avatar_url: form.avatar_url,
        date_of_birth: new Date(form.date_of_birth),
        gender: form.gender,
        membership_status: form.membership_status,
        current_package_id: form.current_package_id,
        package_end_date: new Date(form.package_end_date),
        join_date: new Date(form.join_date),
        assigned_staff_id: form.assigned_staff_id,
        fitness_goal: form.fitness_goal ? form.fitness_goal.split(',').map(s => s.trim()) : [],
        medical_conditions: form.medical_conditions ? form.medical_conditions.split(',').map(s => s.trim()) : [],
        initial_measurements: initial_measurements, // Gán đối tượng vừa tạo
      });
      setSuccessMessage("Tạo người dùng thành công!");
      // Nếu muốn reset form sau khi thành công, bỏ comment dòng dưới:
      // setForm({ ...form, full_name: "", phone_number: "", email: "", password: "", avatar_url: "", date_of_birth: "", gender: "other", membership_status: "Active", current_package_id: "", package_end_date: "", join_date: "", assigned_staff_id: "", fitness_goal: "", medical_conditions: "", weight: "", height: "" });
    } catch (err) {
      console.error("Lỗi tạo người dùng:", err);
      setError("Không thể tạo người dùng. Vui lòng thử lại.");
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
            <h1>Thêm hội viên mới</h1>
            <p>Nhập thông tin để tạo tài khoản hội viên</p>
          </div>
        </div>
        <form className="addnewuser-form" onSubmit={handleSubmit} noValidate>
          {successMessage && <div className="form-success" style={{ color: 'green', marginBottom: '10px' }}>{successMessage}</div>}
          {error && <div className="form-error">{error}</div>}
          <div className="addnewuser-form-row">
            <div className="addnewuser-form-col">
              <label className="field">
                <span>Họ và tên *</span>
                <input name="full_name" value={form.full_name} onChange={handleChange} required />
              </label>
               <label className="field">
                <span>Ngày sinh *</span>
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required />
              </label>
               <label className="field">
                <span>Giới tính *</span>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
               <label className="field">
                <span>Ngày đăng ký *</span>
                <input name="join_date" type="date" value={form.join_date} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Số điện thoại *</span>
                <input name="phone_number" value={form.phone_number} onChange={handleChange} required />
              </label>
            </div>
            <div className="addnewuser-form-col">
              <label className="field">
                <span>Trạng thái gói tập *</span>
                <select name="membership_status" value={form.membership_status} onChange={handleChange} required>
                  <option value="Active">Hoạt động</option>
                  <option value="Expired">Hết hạn</option>
                  <option value="Frozen">Tạm dừng</option>
                  <option value="Trial">Dùng thử</option>
                </select>
              </label>
              <label className="field">
                <span>Gói tập hiện tại *</span>
                <input name="current_package_id" value={form.current_package_id} onChange={handleChange} required />
              </label>
              <label className="field">
                <span>Ngày hết hạn gói *</span>
                <input name="package_end_date" type="date" value={form.package_end_date} onChange={handleChange} required />
              </label>
            </div>
            <div className="addnewuser-form-col">
             
              <label className="field">
                <span>Nhân viên phụ trách</span>
                <input name="assigned_staff_id" value={form.assigned_staff_id} onChange={handleChange} />
              </label>
              <label className="field">
                <span>Mục tiêu tập luyện (phân cách bằng dấu phẩy)</span>
                <input name="fitness_goal" value={form.fitness_goal} onChange={handleChange} />
              </label>
              <label className="field">
                <span>Vấn đề sức khỏe</span>
                <input name="medical_conditions" value={form.medical_conditions} onChange={handleChange} />
              </label>
              
              {/* THAY ĐỔI 2: Thay thế input JSON bằng 2 input mới */}
              <label className="field">
                <span>Cân nặng ban đầu (kg)</span>
                <input name="weight" type="number" value={form.weight} onChange={handleChange} placeholder='Ví dụ: 70' />
              </label>
              <label className="field">
                <span>Chiều cao ban đầu (cm)</span>
                <input name="height" type="number" value={form.height} onChange={handleChange} placeholder='Ví dụ: 175' />
              </label>
            </div>
          </div>
          <button className="btn primary addnewuser-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Tạo mới"}
          </button>
          <div className="or">hoặc</div>
          <button type="button" className="btn outline addnewuser-btn cancel" onClick={onClose}>
            Hủy
          </button>
        </form>
      </div>
    </div>
  );
}