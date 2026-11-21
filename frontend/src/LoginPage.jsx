import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { ErrorBox, Field } from './components.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/products" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (caught) {
      setError(caught);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <div className="brand login-brand">kursova</div>
      <form className="panel form" onSubmit={submit}>
        <h1>Log in</h1>
        <ErrorBox messages={error?.messages} />
        <Field label="Username">
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
