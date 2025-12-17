import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ authToken, authedEmail, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { label: 'Login', path: '/login', protected: false },
    { label: 'Profile', path: '/profile', protected: true },
    { label: 'Resumes', path: '/resumes', protected: true },
    { label: 'Applications', path: '/applications', protected: true },
  ];

  const visibleItems = menuItems.filter(item => !item.protected || authToken);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">TalentGraph</h2>
      </div>

      <nav className="sidebar-menu">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {authToken && authedEmail ? (
          <div className="user-info">
            <div className="user-email">{authedEmail}</div>
            <button className="btn btn-secondary btn-block spacer-md" onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="not-logged">Not logged in</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
