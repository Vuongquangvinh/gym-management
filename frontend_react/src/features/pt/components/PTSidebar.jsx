import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';

// SVG icons
const Icon = ({ name }) => {
  const map = {
    dashboard: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="10" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>),
    profile: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.2"/></svg>),
    packages: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1" fill="none"/></svg>),
    clients: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2"/></svg>),
    schedule: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.2"/></svg>),
    settings: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 1-1.95-.41 1.65 1.65 0 0 0-2.33 0 1.65 1.65 0 0 1-1.95.41 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 1-.41-1.95 1.65 1.65 0 0 0 0-2.33 1.65 1.65 0 0 1 .41-1.95 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.1 2.1l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 1 1.95.41 1.65 1.65 0 0 0 2.33 0 1.65 1.65 0 0 1 1.95-.41 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.4 4.6l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 1 .41 1.95 1.65 1.65 0 0 0 0 2.33 1.65 1.65 0 0 1-.41 1.95z" stroke="currentColor" strokeWidth="1"/></svg>),
  };
  return <span className="side-icon">{map[name]}</span>;
};

export default function PTSidebar() {
  const { currentUser } = useAuth() || {};
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'PT';

  return (
    <aside className="pt-sidebar">
      <button className="mobile-close" onClick={() => window.dispatchEvent(new CustomEvent('closePTMenu'))}>✕</button>

      <div className="pt-brand">
        <NavLink to="/pt" style={{textDecoration:'none', color: 'inherit'}}>
          PT Portal
        </NavLink>
      </div>

      <nav className="pt-nav">
        <NavLink to="/pt" end className={({isActive})=> isActive? 'active':''}>
          <Icon name="dashboard"/> Dashboard
        </NavLink>
        <NavLink to="/pt/profile" className={({isActive})=> isActive? 'active':''}>
          <Icon name="profile"/> Thông tin của tôi
        </NavLink>
        <NavLink to="/pt/packages" className={({isActive})=> isActive? 'active':''}>
          <Icon name="packages"/> Gói tập của tôi
        </NavLink>
        <NavLink to="/pt/clients" className={({isActive})=> isActive? 'active':''}>
          <Icon name="clients"/> Học viên của tôi
        </NavLink>
        <NavLink to="/pt/schedule" className={({isActive})=> isActive? 'active':''}>
          <Icon name="schedule"/> Lịch làm việc
        </NavLink>
        <NavLink to="/pt/settings" className={({isActive})=> isActive? 'active':''}>
          <Icon name="settings"/> Cài đặt
        </NavLink>
      </nav>

      <div className="pt-profile">
        <div className="avatar">{displayName[0]?.toUpperCase()}</div>
        <div className="profile-meta">
          <div className="name">{displayName}</div>
          <div className="role">Personal Trainer</div>
        </div>
      </div>
    </aside>
  );
}

