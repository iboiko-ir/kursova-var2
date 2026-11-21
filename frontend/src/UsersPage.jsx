import { useState } from 'react';
import { apiRequest, groupFieldErrors } from './api.js';
import { useAuth } from './auth.jsx';
import { ErrorBox, Field, ListState, Pagination } from './components.jsx';
import { formatUtcDateTime } from './format.js';
import { useApiData } from './hooks.js';

const FORM_FIELDS = ['username', 'password', 'role'];

function UserForm({ userToEdit, onSaved, onCancel }) {
  const isNewUser = !userToEdit.id;
  const [values, setValues] = useState({ username: userToEdit.username, password: '', role: userToEdit.role });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { fields, general } = groupFieldErrors(error, FORM_FIELDS);
  const setValue = (name) => (event) => setValues({ ...values, [name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isNewUser) {
        await apiRequest('/users', { method: 'POST', body: values });
      } else {
        const changes = { username: values.username, role: values.role };
        if (values.password !== '') {
          changes.password = values.password;
        }
        await apiRequest(`/users/${userToEdit.id}`, { method: 'PATCH', body: changes });
      }
      onSaved();
    } catch (caught) {
      setError(caught);
      setSubmitting(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{isNewUser ? 'New user' : `Edit user ${userToEdit.username}`}</h2>
      <ErrorBox messages={general} />
      <Field label="Username" errors={fields.username}>
        <input value={values.username} maxLength={50} onChange={setValue('username')} autoComplete="off" required />
      </Field>
      <Field label={isNewUser ? 'Password' : 'New password (leave empty to keep the current one)'} errors={fields.password}>
        <input
          type="password"
          value={values.password}
          maxLength={100}
          onChange={setValue('password')}
          autoComplete="new-password"
          required={isNewUser}
        />
      </Field>
      <Field label="Role" errors={fields.role}>
        <select value={values.role} onChange={setValue('role')}>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <div className="actions">
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save user'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [userToEdit, setUserToEdit] = useState(null);
  const [actionError, setActionError] = useState(null);
  const users = useApiData('/users', { page, limit: 25 });

  async function deleteUser(user) {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      return;
    }
    setActionError(null);
    try {
      await apiRequest(`/users/${user.id}`, { method: 'DELETE' });
      users.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Users</h1>
        {!userToEdit && (
          <button
            type="button"
            className="primary"
            onClick={() => setUserToEdit({ username: '', role: 'operator' })}
          >
            New user
          </button>
        )}
      </div>

      {userToEdit && (
        <UserForm
          key={userToEdit.id || 'new'}
          userToEdit={userToEdit}
          onCancel={() => setUserToEdit(null)}
          onSaved={() => {
            setUserToEdit(null);
            users.reload();
          }}
        />
      )}

      <ErrorBox messages={actionError?.messages} />
      <ListState apiData={users} emptyMessage="No users found.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.username}
                    {user.id === currentUser.id && ' (you)'}
                  </td>
                  <td>{user.role}</td>
                  <td>{formatUtcDateTime(user.createdAt)}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setUserToEdit(user)}>
                      Edit
                    </button>
                    {user.id !== currentUser.id && (
                      <button type="button" onClick={() => deleteUser(user)}>
                        Delete
                      </button>
                    )}
                  </td>
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
