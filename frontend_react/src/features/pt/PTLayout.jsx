import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PTSidebar from './components/PTSidebar';
import PTHeader from './components/PTHeader';
import './pt.css';
import { PTProvider } from '../../firebase/lib/features/pt/pt.provider.jsx';
import { NotificationProvider } from '../../firebase/lib/features/notification/notification.provider.jsx';

export default function PTLayout() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  // Close menu when a global event is dispatched (used by Sidebar mobile close)
  React.useEffect(() => {
    function handler() { setOpen(false); }
    window.addEventListener('closePTMenu', handler);
    return () => window.removeEventListener('closePTMenu', handler);
  }, []);

  return (
    <div className={`pt-root ${open ? 'menu-open' : ''}`} style={{ display: 'flex', height: '100vh', minHeight: '0' }}>
      <PTSidebar />
      <NotificationProvider role="pt">
        <div className="pt-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '0' }}>
          <PTHeader onToggle={toggle} />
          <div className="pt-content" style={{ flex: 1, overflow: 'auto', minHeight: '0' }}>
            <PTProvider>
              <Outlet />
            </PTProvider>
          </div>
        </div>
      </NotificationProvider>
    </div>
  );
}

