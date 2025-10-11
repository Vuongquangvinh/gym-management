(function(){
})();

import React, { useState } from 'react';
import './header.css';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import { useNavigate } from 'react-router-dom';
import { signOutUser, forgotPassword } from '../../../firebase/lib/features/auth/auth.service.js';

export default function Header({ onToggle }) {
	const [open, setOpen] = useState(false);
	const { currentUser } = useAuth();
	const navigate = useNavigate();

	async function handleSignOut() {
		try {
			await signOutUser();
			navigate('/');
		} catch (e) {
			console.error('Sign out failed', e);
			alert('Đăng xuất thất bại');
		}
	}

	async function handleChangePassword() {
		if (!currentUser?.email) return alert('Không có email để gửi hướng dẫn');
		if (!confirm(`Gửi email đặt lại mật khẩu tới ${currentUser.email}?`)) return;
		try {
			await forgotPassword(currentUser.email);
			alert('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
		} catch (e) {
			console.error(e);
			alert('Gửi email đặt lại thất bại');
		}
	}

	return (
		<header className="admin-header">
			<div className="left">
				<button className="menu-btn" aria-label="Toggle navigation" onClick={onToggle}>☰</button>
				<div className="search">
					<input placeholder="Tìm kiếm..." />
				</div>
			</div>

			<div className="right">
				<button className="icon-btn" aria-label="Notifications">
					🔔
					<span className="badge">3</span>
				</button>

				<div className="user dropdown" onClick={() => setOpen((v) => !v)}>
					<div className="avatar">{currentUser?.email?.charAt(0)?.toUpperCase() ?? 'A'}</div>
					<div className="username">{currentUser?.email ? currentUser.email.split('@')[0] : 'Admin'}</div>
					{open && (
						<div className="dropdown-menu">
							<div className="menu-item">
								<strong>{currentUser?.email ?? 'Admin'}</strong>
								<div className="muted">Quản trị viên</div>
							</div>
							<div className="divider" />
							<button className="menu-action" onClick={(e)=>{ e.stopPropagation(); handleChangePassword(); setOpen(false); }}>Đổi mật khẩu</button>
							<button className="menu-action" onClick={(e)=>{ e.stopPropagation(); handleSignOut(); }}>Đăng xuất</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

