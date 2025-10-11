import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cssVars } from '../../../shared/theme/colors';
import './login.css';
import { changePassword } from '../../../firebase/lib/features/auth/auth.service.js';

export default function ChangePasswordPage() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (!document.getElementById('theme-colors')) {
			const style = document.createElement('style');
			style.id = 'theme-colors';
			style.innerHTML = `:root {\n${cssVars()}\n}`;
			document.head.appendChild(style);
		}
	}, []);

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
			await changePassword(currentPassword,newPassword);
			setMessage("Đổi mật khẩu thành công!");
			setTimeout(() => navigate("/admin"), 2000);
		} catch (err) {
			console.error("Lỗi đổi mật khẩu:", err);
			setError("Không thể đổi mật khẩu. Vui lòng thử lại.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="login-page">
			<div className="bg-shapes">
				<span className="shape s1" />
				<span className="shape s2" />
				<span className="shape s3" />
			</div>

			<div className="login-card">
				<div className="brand">
					<div className="logo">REPS</div>
					<div className="brand-text">
						<h1>Đổi mật khẩu</h1>
						<p>Nhập mật khẩu mới để thay đổi mật khẩu tài khoản của bạn</p>
					</div>
				</div>

				<form className="login-form" onSubmit={handleChangePassword} noValidate>
					{message ? (
						<div className="form-success">{message}</div>
					) : (
						<>
							{error && <div className="form-error">{error}</div>}
							<label className="field">
								<span>Mật khẩu hiện tại</span>
								<input
									type="password"
									value={currentPassword}
									onChange={e => setCurrentPassword(e.target.value)}
									placeholder="Mật khẩu hiện tại"
								/>
							</label>
							<label className="field">
								<span>Mật khẩu mới</span>
								<input
									type="password"
									value={newPassword}
									onChange={e => setNewPassword(e.target.value)}
									placeholder="Mật khẩu mới"
									required
								/>
							</label>
							<label className="field">
								<span>Xác nhận mật khẩu mới</span>
								<input
									type="password"
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									placeholder="Xác nhận mật khẩu mới"
									required
								/>
							</label>
							<button className="btn primary" type="submit" disabled={isLoading}>
								{isLoading ? "Đang xử lý..." : "Lưu"}
							</button>
							<div className="or">hoặc</div>
							<Link to="/dashboard" className="btn outline" style={{ textDecoration: 'none' }}>Quay lại Dashboard</Link>
						</>
					)}
				</form>

				<footer className="card-foot">
					<small>Vẫn cần trợ giúp? <a href="#">Liên hệ quản trị</a></small>
				</footer>
			</div>
		</div>
	);
}
