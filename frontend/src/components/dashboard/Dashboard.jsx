import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, 
  FaHeart, 
  FaWallet, 
  FaHistory, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaFileAlt,
  FaBell,
  FaTicketAlt,
  FaSave
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Common menu items for all users
  const commonMenuItems = [
    { path: '/dashboard/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/dashboard/favorites', icon: <FaHeart />, label: 'Favorite Properties' },
    { path: '/dashboard/wallet', icon: <FaWallet />, label: 'Wallet' },
    { path: '/dashboard/history', icon: <FaHistory />, label: 'History' },
    { path: '/dashboard/notifications', icon: <FaBell />, label: 'Notifications' },
    { path: '/dashboard/settings', icon: <FaCog />, label: 'Settings' },
  ];

  // Dealer-specific menu items
  const dealerMenuItems = [
    { path: '/dashboard/my-properties', icon: <FaHome />, label: 'My Properties' },
    { path: '/dashboard/draft-properties', icon: <FaSave />, label: 'Draft Properties' },
    { path: '/dashboard/analytics', icon: <FaChartLine />, label: 'Analytics' },
    { path: '/dashboard/leads', icon: <FaUsers />, label: 'Leads' },
    { path: '/dashboard/documents', icon: <FaFileAlt />, label: 'Documents' },
  ];

  // Corporate-specific menu items
  const corporateMenuItems = [
    { path: '/dashboard/company-properties', icon: <FaBuilding />, label: 'Company Properties' },
    { path: '/dashboard/team', icon: <FaUsers />, label: 'Team Management' },
    { path: '/dashboard/analytics', icon: <FaChartLine />, label: 'Analytics' },
  ];

  // Admin-specific menu items
  const adminMenuItems = [
    { path: '/dashboard/users', icon: <FaUsers />, label: 'User Management' },
    { path: '/dashboard/properties', icon: <FaBuilding />, label: 'Property Management' },
    { path: '/dashboard/analytics', icon: <FaChartLine />, label: 'Analytics' },
    { path: '/dashboard/reports', icon: <FaFileAlt />, label: 'Reports' },
  ];

  // Get role-specific menu items
  const getRoleSpecificMenuItems = () => {
    switch (user?.role) {
      case 'dealer':
        return dealerMenuItems;
      case 'corporate':
        return corporateMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return [];
    }
  };

  // Combine common and role-specific menu items
  const menuItems = [...commonMenuItems, ...getRoleSpecificMenuItems()];

  // Add coupons menu item for individual and corporate users
  if (user?.role === 'individual' || user?.role === 'corporate') {
    menuItems.push({ path: '/dashboard/coupons', icon: <FaTicketAlt />, label: 'My Coupons' });
  }

  return (
    <div className="dashboard-container">
      {}
      <button 
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {}
      <div className={`dashboard-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>User Dashboard</h2>
          <div className="user-info">
            <div className="user-avatar">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
              )}
            </div>
            <div className="user-details">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email}</p>
              <span className="user-role">{user?.role || 'User'}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button 
            className="nav-item logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {}
      <div className={`dashboard-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard; 