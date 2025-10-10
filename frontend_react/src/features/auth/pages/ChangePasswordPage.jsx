import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from '../../../firebase/lib/features/auth/auth.service.js';

const ChangePasswordPage = () => {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	// Firebase không hỗ trợ xác thực lại bằng mật khẩu hiện tại trực tiếp,
	// nên nếu cần xác thực lại, phải dùng reauthenticateWithCredential.
	// Ở đây chỉ thực hiện đổi mật khẩu cho user đã đăng nhập.
	const handleChangePassword = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (!newPassword || !confirmPassword) {
			setError("Vui lòng nhập đầy đủ mật khẩu mới.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Mật khẩu xác nhận không khớp.");
			return;
		}

		setIsLoading(true);
		try {
			await changePassword(newPassword);
			setMessage("Đổi mật khẩu thành công!");
			setTimeout(() => navigate("/dashboard"), 2000);
		} catch (err) {
      console.error("Lỗi đổi mật khẩu:", err);
			setError("Không thể đổi mật khẩu. Vui lòng thử lại.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h2>Đổi mật khẩu</h2>
			{error && <p style={{ color: "red" }}>{error}</p>}
			{message && <p style={{ color: "green" }}>{message}</p>}
			<form onSubmit={handleChangePassword}>
				
				<div>
					<label>Mật khẩu hiện tại</label>
					<input
						type="password"
						value={currentPassword}
						onChange={e => setCurrentPassword(e.target.value)}
						placeholder="Mật khẩu hiện tại"
					/>
				</div> 
				<div>
					<label>Mật khẩu mới</label>
					<input
						type="password"
						value={newPassword}
						onChange={e => setNewPassword(e.target.value)}
						placeholder="Mật khẩu mới"
						required
					/>
				</div>
				<div>
					<label>Xác nhận mật khẩu mới</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						placeholder="Xác nhận mật khẩu mới"
						required
					/>
				</div>
				<button type="submit" disabled={isLoading}>
					{isLoading ? "Đang xử lý..." : "Lưu"}
				</button>
			</form>
		</div>
	);
};

export default 	ChangePasswordPage;
