import { useState } from 'react';
import { api, fieldErrors } from './api.js';
import { useAuth } from './auth.jsx';
import { ErrorBox, Field, Pagination, Status } from './components.jsx';
import { useDebounced, useList } from './hooks.js';

const FIELDS = ['name', 'contactDetails'];

function PartyForm({ title, initial, onSaved, onCancel, path, singular }) {
  const [values, setValues] = useState({ name: initial.name, contactDetails: initial.contactDetails || '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { fields, general } = fieldErrors(error, FIELDS);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (initial.id) {
        await api(`${path}/${initial.id}`, { method: 'PATCH', body: values });
      } else {
        await api(path, { method: 'POST', body: values });
      }
      onSaved();
    } catch (caught) {
      setError(caught);
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{title}</h2>
      <ErrorBox messages={general} />
      <Field label="Name" errors={fields.name}>
        <input
          value={values.name}
          maxLength={120}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          required
        />
      </Field>
      <Field label="Contact details" errors={fields.contactDetails}>
        <textarea
          rows={3}
          maxLength={500}
          value={values.contactDetails}
          onChange={(event) => setValues({ ...values, contactDetails: event.target.value })}
        />
      </Field>
      <div className="actions">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving...' : `Save ${singular}`}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PartiesPage({ title, singular, path }) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState(null);
  const debouncedSearch = useDebounced(search);
  const list = useList(path, { page, limit: 25, search: debouncedSearch.trim(), includeArchived });

  async function toggleArchive(party) {
    const action = party.archived ? 'restore' : 'archive';
    if (!party.archived && !window.confirm(`Archive ${singular} "${party.name}"? Its history is kept.`)) {
      return;
    }
    setActionError(null);
    try {
      await api(`${path}/${party.id}/${action}`, { method: 'POST' });
      list.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
        {isAdmin && !editing && (
          <button type="button" className="primary" onClick={() => setEditing({ name: '', contactDetails: '' })}>
            New {singular}
          </button>
        )}
      </div>

      {editing && (
        <PartyForm
          key={editing.id || 'new'}
          title={editing.id ? `Edit ${singular}` : `New ${singular}`}
          initial={editing}
          path={path}
          singular={singular}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name or contact details"
          aria-label="Search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => {
              setIncludeArchived(event.target.checked);
              setPage(1);
            }}
          />
          Show archived
        </label>
      </div>

      <ErrorBox messages={actionError?.messages} />
      <Status list={list} empty={`No ${title.toLowerCase()} found.`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact details</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((party) => (
                <tr key={party.id} className={party.archived ? 'archived' : undefined}>
                  <td>{party.name}</td>
                  <td>{party.contactDetails || '-'}</td>
                  <td>{party.archived ? 'Archived' : 'Active'}</td>
                  {isAdmin && (
                    <td className="row-actions">
                      <button type="button" onClick={() => setEditing(party)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleArchive(party)}>
                        {party.archived ? 'Restore' : 'Archive'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Status>
      <Pagination data={list.data} page={page} onPage={setPage} />
    </>
  );
}
