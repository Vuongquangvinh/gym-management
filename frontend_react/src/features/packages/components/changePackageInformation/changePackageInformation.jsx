import React, { useState } from "react";
import styles from './changePackageInformation.module.css';
import { PackageModel } from "../../../../firebase/lib/features/package/packages.model.js";

export default function ChangePackageInformation({ pkg, onSave, onCancel }) {
	const [form, setForm] = useState({
		PackageId: pkg.rawData?.PackageId || pkg.id || "",
		PackageName: pkg.rawData?.PackageName || pkg.name || "",
		PackageType: pkg.rawData?.PackageType || pkg.type || "",
		Duration: pkg.rawData?.Duration || (pkg.duration ? parseInt(pkg.duration) : ""),
		Price: pkg.rawData?.Price || (pkg.price ? parseInt(pkg.price.replace(/[^\d]/g, '')) : ""),
		Description: pkg.rawData?.Description || pkg.description || "",
		NumberOfSession: pkg.rawData?.NumberOfSession || pkg.sessions || "",
		Discount: pkg.rawData?.Discount || "",
		StartDayDiscount: pkg.rawData?.StartDayDiscount 
			? (pkg.rawData.StartDayDiscount instanceof Date 
				? pkg.rawData.StartDayDiscount.toISOString().split('T')[0]
				: "")
			: "",
		EndDayDiscount: pkg.rawData?.EndDayDiscount
			? (pkg.rawData.EndDayDiscount instanceof Date
				? pkg.rawData.EndDayDiscount.toISOString().split('T')[0]
				: "")
			: "",
		UsageCondition: pkg.rawData?.UsageCondition || pkg.promotion || "",
		Status: pkg.rawData?.Status || pkg.status || "active",
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			// Chuẩn bị dữ liệu để update
			const dataToUpdate = {};

			// Chỉ update các field đã thay đổi
			if (form.PackageName !== pkg.rawData?.PackageName) {
				dataToUpdate.PackageName = form.PackageName;
			}
			if (form.PackageType !== pkg.rawData?.PackageType) {
				dataToUpdate.PackageType = form.PackageType;
			}
			if (form.Description !== pkg.rawData?.Description) {
				dataToUpdate.Description = form.Description;
			}
			if (Number(form.Duration) !== pkg.rawData?.Duration) {
				dataToUpdate.Duration = Number(form.Duration);
			}
			if (Number(form.Price) !== pkg.rawData?.Price) {
				dataToUpdate.Price = Number(form.Price);
			}
			if (form.Status !== pkg.rawData?.Status) {
				dataToUpdate.Status = form.Status;
			}
			if (form.NumberOfSession && Number(form.NumberOfSession) !== pkg.rawData?.NumberOfSession) {
				dataToUpdate.NumberOfSession = Number(form.NumberOfSession);
			}

			// Xử lý discount fields
			const hasDiscount = form.Discount && parseFloat(form.Discount) > 0;
			
			if (hasDiscount) {
				// Validate dates nếu có discount
				if (!form.StartDayDiscount || !form.EndDayDiscount) {
					throw new Error("Vui lòng nhập ngày bắt đầu và kết thúc giảm giá.");
				}
				if (new Date(form.EndDayDiscount) < new Date(form.StartDayDiscount)) {
					throw new Error("Ngày kết thúc giảm giá phải sau ngày bắt đầu.");
				}

				dataToUpdate.Discount = Number(form.Discount);
				dataToUpdate.StartDayDiscount = new Date(form.StartDayDiscount);
				dataToUpdate.EndDayDiscount = new Date(form.EndDayDiscount);
				if (form.UsageCondition) {
					dataToUpdate.UsageCondition = form.UsageCondition;
				}
			} else {
				// Nếu không có discount, xóa các fields liên quan
				dataToUpdate.Discount = null;
				dataToUpdate.StartDayDiscount = null;
				dataToUpdate.EndDayDiscount = null;
				dataToUpdate.UsageCondition = null;
			}

			// Loại bỏ các field rỗng hoặc null
			Object.keys(dataToUpdate).forEach(key => {
				if (dataToUpdate[key] === "" || dataToUpdate[key] === undefined) {
					delete dataToUpdate[key];
				}
			});

			console.log("📦 Data to update:", dataToUpdate);
			console.log("🔑 Firestore Document ID:", pkg.firestoreId || pkg.rawData?._firestoreId);
			console.log("📝 User Package ID:", pkg.id || pkg.rawData?.PackageId);

			// Sử dụng Firestore document ID để update, KHÔNG phải PackageId
			const firestoreDocId = pkg.firestoreId || pkg.rawData?._firestoreId;
			
			if (!firestoreDocId) {
				throw new Error("Không tìm thấy Firestore document ID. Vui lòng reload trang.");
			}

			// Gọi update API với Firestore document ID
			await PackageModel.update(firestoreDocId, dataToUpdate);

			console.log("✅ Package updated successfully");
			alert("✅ Cập nhật gói tập thành công!");
			
			if (onSave) onSave(form);
		} catch (err) {
			console.error("❌ Error updating package:", err);
			setError(err.message || "Có lỗi xảy ra khi cập nhật gói tập.");
		} finally {
			setLoading(false);
		}
	};

	// Kiểm tra xem trường Discount có giá trị hợp lệ hay không
	const isDiscountEnabled = form.Discount && parseFloat(form.Discount) > 0;

	return (
		<div className={styles.changePackageContainer}>
			<h2>Chỉnh sửa thông tin gói tập</h2>
			<form onSubmit={handleSubmit} className={styles.changePackageForm}>
				<div className={styles.formRow}>
					<label>Mã gói</label>
					<input type="text" value={form.PackageId} disabled />
				</div>
				<div className={styles.formRow}>
					<label>Tên gói <span className={styles.required}>*</span></label>
					<input type="text" name="PackageName" value={form.PackageName} onChange={handleChange} required />
				</div>
				<div className={styles.formRow}>
					<label>Loại gói <span className={styles.required}>*</span></label>
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
				<div className={styles.formRow}>
					<label>Thời hạn (ngày) <span className={styles.required}>*</span></label>
					<input
						type="number"
						name="Duration"
						value={form.Duration}
						onChange={handleChange}
						required
						min="1"
						placeholder="Nhập số ngày"
					/>
				</div>
				<div className={styles.formRow}>
					<label>Giá (VNĐ) <span className={styles.required}>*</span></label>
					<input
						type="number"
						name="Price"
						value={form.Price}
						onChange={handleChange}
						required
						min="0"
						placeholder="Nhập giá"
					/>
				</div>
				<div className={styles.formRow}>
					<label>Số buổi tập</label>
					<input
						type="number"
						name="NumberOfSession"
						value={form.NumberOfSession}
						onChange={handleChange}
						min="0"
						placeholder="Nhập số buổi tập"
					/>
				</div>
				<div className={styles.formRow}>
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
				<div className={styles.formRow}>
					<label>Bắt đầu giảm giá</label>
					<input
						type="date"
						name="StartDayDiscount"
						value={form.StartDayDiscount}
						onChange={handleChange}
						disabled={!isDiscountEnabled}
					/>
				</div>
				<div className={styles.formRow}>
					<label>Kết thúc giảm giá</label>
					<input
						type="date"
						name="EndDayDiscount"
						value={form.EndDayDiscount}
						onChange={handleChange}
						disabled={!isDiscountEnabled}
					/>
				</div>
				<div className={styles.formRow}>
					<label>Điều kiện sử dụng</label>
					<textarea
						name="UsageCondition"
						value={form.UsageCondition}
						onChange={handleChange}
						rows="3"
						disabled={!isDiscountEnabled}
						placeholder="Nhập điều kiện sử dụng (nếu có)"
					/>
				</div>
				<div className={styles.formRow}>
					<label>Mô tả</label>
					<textarea
						name="Description"
						value={form.Description}
						onChange={handleChange}
						rows="3"
						placeholder="Nhập mô tả gói tập"
					/>
				</div>
				<div className={styles.formRow}>
					<label>Trạng thái <span className={styles.required}>*</span></label>
					<select name="Status" value={form.Status} onChange={handleChange} required>
						<option value="active">Đang áp dụng</option>
						<option value="inactive">Ngừng áp dụng</option>
					</select>
				</div>

				{error && <p className={styles.errorText}>{error}</p>}

				<div className={styles.formActions}>
					<button type="submit" className={styles.saveBtn} disabled={loading}>
						{loading ? "Đang lưu..." : "Lưu"}
					</button>
					<button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
						Hủy
					</button>
				</div>
			</form>
		</div>
	);
}
