import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import '../../../features/admin/admin.css';
// small inline SVG icons to avoid adding deps
const Icon = ({ name }) => {
  const map = {
    dashboard: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="13" y="10" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>),
    members: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M3 21c1-4 6-6 6-6s5 2 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    checkins: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    packages: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1" fill="none"/></svg>),
    reports: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.2"/><path d="M7 14h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>),
    settings: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 1-1.95-.41 1.65 1.65 0 0 0-2.33 0 1.65 1.65 0 0 1-1.95.41 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 1-.41-1.95 1.65 1.65 0 0 0 0-2.33 1.65 1.65 0 0 1 .41-1.95 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.1 2.1l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 1 1.95.41 1.65 1.65 0 0 0 2.33 0 1.65 1.65 0 0 1 1.95-.41 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.4 4.6l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 1 .41 1.95 1.65 1.65 0 0 0 0 2.33 1.65 1.65 0 0 1-.41 1.95z" stroke="currentColor" strokeWidth="1"/></svg>),
  };
  return <span className="side-icon">{map[name]}</span>;
};

export default function Sidebar() {
  const { currentUser } = useAuth() || {};
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';

  return (
    <aside className="admin-sidebar">
      <button className="mobile-close" onClick={() => window.dispatchEvent(new CustomEvent('closeAdminMenu'))}>✕</button>

      <div className="side-brand"><NavLink to="/admin" style={{textDecoration:'none', color:'inherit'}}>REPS</NavLink></div>

      <nav className="side-nav">
        <NavLink to="/admin" end className={({isActive})=> isActive? 'active':''}><Icon name="dashboard"/> Dashboard</NavLink>
        <NavLink to="/admin/members" className={({isActive})=> isActive? 'active':''}><Icon name="members"/> Members</NavLink>
        <NavLink to="/admin/checkins" className={({isActive})=> isActive? 'active':''}><Icon name="checkins"/> Check-ins</NavLink>
        <NavLink to="/admin/packages" className={({isActive})=> isActive? 'active':''}><Icon name="packages"/> Packages</NavLink>
        <NavLink to="/admin/reports" className={({isActive})=> isActive? 'active':''}><Icon name="reports"/> Reports</NavLink>
        <NavLink to="/admin/settings" className={({isActive})=> isActive? 'active':''}><Icon name="settings"/> Settings</NavLink>
      </nav>

      <div className="side-cta"> 
        <button className="btn small" onClick={()=>alert('Create new member (mô phỏng)')}>+ Tạo mới</button>
      </div>

      <div className="side-profile">
        <div className="avatar">{displayName[0]?.toUpperCase()}</div>
        <div className="profile-meta">
          <div className="name">{displayName}</div>
          <div className="email">{currentUser?.email ?? 'admin@example.com'}</div>
        </div>
      </div>
    </aside>
  );
}
