import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Receipt, Home, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'My Properties', href: '/properties', icon: Home },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-blue-600 text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex flex-col w-64 bg-blue-900 text-white">
        <div className="p-5 border-b border-blue-700">
          <h2 className="text-xl font-bold">BuildEstate</h2>
          <p className="text-blue-300 text-sm">Customer Dashboard</p>
        </div>
        <nav className="flex-1 pt-5">
          <ul>
            {navigation.map((item) => (
              <li key={item.name} className="mb-1">
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                    } transition-colors duration-200`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-5 border-t border-blue-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-blue-300">john@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-blue-900 text-white mt-[18%]">
          <div className="p-5 border-b border-blue-700">
            <h2 className="text-xl font-bold">BuildEstate</h2>
            <p className="text-blue-300 text-sm">Customer Dashboard</p>
          </div>
          <nav className="pt-5">
            <ul>
              {navigation.map((item) => (
                <li key={item.name} className="mb-1">
                  <NavLink
                    to={item.href}
                    onClick={toggleMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center py-3 px-6 ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                      } transition-colors duration-200`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default Sidebar;