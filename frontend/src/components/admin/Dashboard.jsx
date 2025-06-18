import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Home, Building, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: Home },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/properties', label: 'Properties', icon: Building },
    { path: '/admin/room-availability-requests', label: 'Room Requests', icon: Building },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="logout-button">
          <LogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard; 