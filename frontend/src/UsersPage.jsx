import { useState } from 'react';
import { apiRequest, groupFieldErrors } from './api.js';
import { ErrorBox, Field, Pagination, ListState } from './components.jsx';
import { formatUtcDateTime } from './format.js';
import { useApiData } from './hooks.js';

const FORM_FIELDS = ['username', 'password', 'role'];
const EMPTY_USER = { username: '', password: '', role: 'operator' };

function NewUserForm({ onSaved, onCancel }) {
  const [values, setValues] = useState(EMPTY_USER);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { fields, general } = groupFieldErrors(error, FORM_FIELDS);
  const setValue = (name) => (event) => setValues({ ...values, [name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/users', { method: 'POST', body: values });
      onSaved();
    } catch (caught) {
      setError(caught);
      setSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>New user</h2>
      <ErrorBox messages={general} />
      <Field label="Username" errors={fields.username}>
        <input value={values.username} maxLength={50} onChange={setValue('username')} autoComplete="off" required />
      </Field>
      <Field label="Password (at least 8 characters)" errors={fields.password}>
        <input
          type="password"
          value={values.password}
          maxLength={100}
          onChange={setValue('password')}
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label="Role" errors={fields.role}>
        <select value={values.role} onChange={setValue('role')}>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <div className="actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save user'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const users = useApiData('/users', { page, limit: 25 });

  return (
    <>
      <div className="page-head">
        <h1>Users</h1>
        {!showForm && (
          <button type="button" className="primary" onClick={() => setShowForm(true)}>
            New user
          </button>
        )}
      </div>
      <p className="muted">There is no public sign-up. Only an admin adds users.</p>

      {showForm && (
        <NewUserForm
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            users.reload();
          }}
        />
      )}

      <ListState apiData={users} emptyMessage="No users found.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{formatUtcDateTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListState>
      <Pagination data={users.data} page={page} onPageChange={setPage} />
    </>
  );
}
