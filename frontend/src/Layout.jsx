import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiRequest } from './api.js';
import { useAuth } from './auth.jsx';

export default function Layout() {
  const { user, loading, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [activeNotificationCount, setActiveNotificationCount] = useState(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    let isCurrent = true;
    apiRequest('/notifications/summary')
      .then((summary) => isCurrent && setActiveNotificationCount(summary.active))
      .catch(() => isCurrent && setActiveNotificationCount(null));
    return () => {
      isCurrent = false;
    };
  }, [user, location.pathname]);

  if (loading) {
    return <p className="loading-page">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <span className="brand">kursova</span>
        <span className="topbar-title">Warehouse</span>
        <span className="spacer" />
        <span className="user">
          {user.username} ({user.role})
        </span>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </header>
      <div className="app-body">
        <nav className="sidebar no-print" aria-label="Main menu">
          <div className="sidebar-group">Warehouse</div>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/movements">Movements</NavLink>
          <NavLink to="/notifications">
            Notifications
            {activeNotificationCount > 0 && <span className="badge">{activeNotificationCount}</span>}
          </NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <div className="sidebar-group">Directories</div>
          <NavLink to="/suppliers">Suppliers</NavLink>
          <NavLink to="/counterparties">Counterparties</NavLink>
          {isAdmin && (
            <>
              <div className="sidebar-group">Administration</div>
              <NavLink to="/users">Users</NavLink>
            </>
          )}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
