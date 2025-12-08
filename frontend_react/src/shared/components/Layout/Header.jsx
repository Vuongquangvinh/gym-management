import React, { useState } from 'react';
import styles from './header.module.css';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../../../firebase/lib/features/auth/auth.service.js';
import { NotificationBell } from '../Notification/NotificationBell.jsx';

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
		navigate('/change-password');
	}

	return (
		<header className={styles.adminHeader}>
			<div className={styles.left}>
				<button className={styles.menuBtn} aria-label="Toggle navigation" onClick={onToggle}>☰</button>
				<div className={styles.search}>
					<input placeholder="Tìm kiếm..." />
				</div>
			</div>

			<div className={styles.right}>
				<NotificationBell />

				<div className={`${styles.user} ${styles.dropdown}`} onClick={() => setOpen((v) => !v)}>
					<div className={styles.avatar}>{currentUser?.email?.charAt(0)?.toUpperCase() ?? 'A'}</div>
					<div className={styles.username}>{currentUser?.email ? currentUser.email.split('@')[0] : 'Admin'}</div>
					{open && (
						<div className={styles.dropdownMenu}>
							<div className={styles.menuItem}>
								<strong>{currentUser?.email ?? 'Admin'}</strong>
								<div className="muted">Quản trị viên</div>
							</div>
							<div className={styles.divider} />
							<button className={styles.menuAction} onClick={(e)=>{ e.stopPropagation(); handleChangePassword(); setOpen(false); }}>Đổi mật khẩu</button>
							<button className={styles.menuAction} onClick={(e)=>{ e.stopPropagation(); handleSignOut(); }}>Đăng xuất</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

