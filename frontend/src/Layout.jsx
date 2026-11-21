import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    let current = true;
    api('/notifications/summary')
      .then((result) => current && setActive(result.active))
      .catch(() => current && setActive(null));
    return () => {
      current = false;
    };
  }, [user, location.pathname]);

  if (loading) {
    return <p className="muted content">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">kursova</span>
        <nav aria-label="Main navigation">
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/movements">Movements</NavLink>
          <NavLink to="/notifications">
            Notifications
            {active > 0 && <span className="badge">{active}</span>}
          </NavLink>
          <NavLink to="/suppliers">Suppliers</NavLink>
          <NavLink to="/counterparties">Counterparties</NavLink>
        </nav>
        <span className="spacer" />
        <span className="user">
          {user.username} ({user.role})
        </span>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </>
  );
}
