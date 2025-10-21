import React, { useState } from "react";
import "./addNewPackage.css";

import { PackageModel } from "../../../../firebase/lib/features/package/packages.model.js";

export default function AddNewPackage({ onSave, onCancel }) {
  const [form, setForm] = useState({
    PackageId: "",
    PackageName: "",
    PackageType: "",
    Description: "",
    Duration: "",
    Price: "",
    Status: "active",
    NumberOfSession: "",
    Discount: "",
    StartDayDiscount: "",
    EndDayDiscount: "",
    UsageCondition: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Chuẩn bị dữ liệu để submit
      const dataToSubmit = { ...form };

      // Kiểm tra nếu có nhập Discount
      const hasDiscount = dataToSubmit.Discount && parseFloat(dataToSubmit.Discount) > 0;

      if (hasDiscount) {
        // Nếu có giảm giá, bắt buộc phải có ngày bắt đầu và kết thúc
        if (!dataToSubmit.StartDayDiscount || !dataToSubmit.EndDayDiscount) {
          throw new Error("Vui lòng nhập ngày bắt đầu và kết thúc giảm giá.");
        }
        // Kiểm tra ngày hợp lệ
        if (new Date(dataToSubmit.EndDayDiscount) < new Date(dataToSubmit.StartDayDiscount)) {
          throw new Error("Ngày kết thúc giảm giá phải sau ngày bắt đầu.");
        }
      } else {
        // Nếu không có giảm giá, xóa các trường liên quan
        delete dataToSubmit.Discount;
        delete dataToSubmit.StartDayDiscount;
        delete dataToSubmit.EndDayDiscount;
        delete dataToSubmit.UsageCondition;
      }

      // Loại bỏ các trường rỗng
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === "" || dataToSubmit[key] === null || dataToSubmit[key] === undefined) {
          delete dataToSubmit[key];
        }
      });

      console.log("📦 Data to submit:", dataToSubmit);

      const result = await PackageModel.create(dataToSubmit);
      console.log("✅ Package created:", result);
      
      alert("✅ Gói tập đã được thêm thành công!");
      if (onSave) onSave(result);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Có lỗi xảy ra khi thêm gói tập.");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xem trường Discount có giá trị hợp lệ hay không
  const isDiscountEnabled = form.Discount && parseFloat(form.Discount) > 0;

  return (
    <div className="add-package-container">
      <h2>Thêm gói tập mới</h2>

      <form className="add-package-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Mã gói <span className="required">*</span></label>
            <input
              type="text"
              name="PackageId"
              value={form.PackageId}
              onChange={handleChange}
              required
              placeholder="Nhập mã gói (ví dụ: PK001)"
            />
          </div>

          <div className="form-group">
            <label>Tên gói <span className="required">*</span></label>
            <input
              type="text"
              name="PackageName"
              value={form.PackageName}
              onChange={handleChange}
              required
              placeholder="Nhập tên gói (ví dụ: Gói cơ bản 1 tháng)"
            />
          </div>

          <div className="form-group">
            <label>Loại gói <span className="required">*</span></label>
            <select
              name="PackageType"
              value={form.PackageType}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn loại --</option>
              <option value="Personal">Cá nhân</option>
              <option value="PT">Huấn luyện viên cá nhân</option>
              <option value="Trial">Thử nghiệm</option>
              <option value="Promotional">Khuyến mãi</option>
            </select>
          </div>

          <div className="form-group">
            <label>Thời hạn (ngày) <span className="required">*</span></label>
            <input
              type="number"
              name="Duration"
              value={form.Duration}
              onChange={handleChange}
              required
              min="1"
              placeholder="Nhập số ngày (ví dụ: 30)"
            />
          </div>

          <div className="form-group">
            <label>Giá (VNĐ) <span className="required">*</span></label>
            <input
              type="number"
              name="Price"
              value={form.Price}
              onChange={handleChange}
              required
              min="0"
              placeholder="Nhập giá (ví dụ: 500000)"
            />
          </div>

          <div className="form-group">
            <label>Trạng thái <span className="required">*</span></label>
            <select
              name="Status"
              value={form.Status}
              onChange={handleChange}
              required
            >
              <option value="active">Kích hoạt</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>

          <div className="form-group">
            <label>Số buổi tập</label>
            <input
              type="number"
              name="NumberOfSession"
              value={form.NumberOfSession}
              onChange={handleChange}
              min="0"
              placeholder="Nhập số buổi (nếu có, ví dụ: 12)"
            />
          </div>

          <div className="form-group">
            <label>Giảm giá (%)</label>
            <input
              type="number"
              name="Discount"
              value={form.Discount}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="Nhập % giảm giá (0–100)"
            />
          </div>

          <div className="form-group">
            <label>Bắt đầu giảm giá</label>
            <input
              type="date"
              name="StartDayDiscount"
              value={form.StartDayDiscount}
              onChange={handleChange}
              disabled={!isDiscountEnabled}
            />
          </div>

          <div className="form-group">
            <label>Kết thúc giảm giá</label>
            <input
              type="date"
              name="EndDayDiscount"
              value={form.EndDayDiscount}
              onChange={handleChange}
              disabled={!isDiscountEnabled}
            />
          </div>

          <div className="form-group full">
            <label>Điều kiện sử dụng</label>
            <textarea
              name="UsageCondition"
              value={form.UsageCondition}
              onChange={handleChange}
              rows="3"
              disabled={!isDiscountEnabled}
              placeholder="Nhập điều kiện sử dụng (nếu có)"
            ></textarea>
          </div>

          <div className="form-group full">
            <label>Mô tả</label>
            <textarea
              name="Description"
              value={form.Description}
              onChange={handleChange}
              rows="3"
              placeholder="Nhập mô tả gói tập"
            ></textarea>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}