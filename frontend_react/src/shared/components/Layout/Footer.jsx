import React from 'react';
import styles from '../../../features/admin/admin.module.css';

export default function Footer(){
  return (
    <footer className={styles.adminFooter}>
      <div className={styles.footerInner}>
        <div className={styles.left}>© {new Date().getFullYear()} REPS Gym — All rights reserved</div>
        <div className={styles.right}>Built with ❤️ · v0.1</div>
      </div>
    </footer>
  );
}
