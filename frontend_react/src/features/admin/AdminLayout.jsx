import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../shared/components/Layout/Sidebar';
import Header from '../../shared/components/Layout/Header';
import Footer from '../../shared/components/Layout/Footer';
import './admin.css';
import { CheckinProvider } from '../../firebase/lib/features/checkin/checkin.provier.jsx';

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  // Close menu when a global event is dispatched (used by Sidebar mobile close)
  React.useEffect(() => {
    function handler() { setOpen(false); }
    window.addEventListener('closeAdminMenu', handler);
    return () => window.removeEventListener('closeAdminMenu', handler);
  }, []);

  return (
    <div className={`admin-root ${open ? 'menu-open' : ''}`}>
      <Sidebar />
      <div className="admin-main">
        <Header onToggle={toggle} />
        <div className="admin-content">
          {/* Render nested routes here */}
          <CheckinProvider>
            <Outlet />
          </CheckinProvider>
        </div>
        <Footer />
      </div>
    </div>
  );
}
