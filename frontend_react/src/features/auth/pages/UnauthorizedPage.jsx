import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Unauthorized.module.css';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    const handleGoBack = () => {
        // Redirect về trang phù hợp với role
        if (userRole === 'pt') {
            navigate('/pt');
        } else if (userRole === 'admin') {
            navigate('/admin');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.icon}>🚫</div>
                <h1 className={styles.title}>Không có quyền truy cập</h1>
                <p className={styles.message}>
                    Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
                </p>
                <button onClick={handleGoBack} className={styles.button}>
                    Quay lại trang chủ
                </button>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
