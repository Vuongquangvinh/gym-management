import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../shared/components/Layout/Sidebar';
import Header from '../../shared/components/Layout/Header';
import Footer from '../../shared/components/Layout/Footer';
import './admin.css';
import { CheckinProvider } from '../../firebase/lib/features/checkin/checkin.provider.jsx';
import { PTProvider } from '../../firebase/lib/features/pt/pt.provider.jsx';
import { EmployeeProvider } from '../../firebase/lib/features/employee/employee.provider.jsx';
import { NotificationProvider } from '../../firebase/lib/features/notification/notification.provider.jsx';

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  // Close menu when a global event is dispatched (used by Sidebar mobile close)
  React.useEffect(() => {
    function handler() { setOpen(false); }
    window.addEventListener('closeAdminMenu', handler);
    return () => window.removeEventListener('closeAdminMenu', handler);
  }, []);

  // Sửa layout: flex, sidebar 100vh, main chiếm phần còn lại, content cuộn độc lập
  return (
    <div className={`admin-root ${open ? 'menu-open' : ''}`} style={{ display: 'flex', height: '100vh', minHeight: '0' }}>
      <Sidebar />
      <NotificationProvider role="admin">
        <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '0' }}>
          <Header onToggle={toggle} />
          <div className="admin-content" style={{ flex: 1, overflow: 'auto', minHeight: '0' }}>
            {/* Render nested routes here */}
            <EmployeeProvider>
              <CheckinProvider>
                <PTProvider>
                  <Outlet />
                </PTProvider>
              </CheckinProvider>
            </EmployeeProvider>
          </div>
          <Footer />
        </div>
      </NotificationProvider>
    </div>
  );
}
