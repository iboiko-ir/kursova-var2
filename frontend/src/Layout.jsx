import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth.jsx';

export default function Layout() {
  const { user, loading, logout } = useAuth();

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
