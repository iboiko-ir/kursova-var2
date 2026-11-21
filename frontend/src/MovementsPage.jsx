import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { ErrorBox, Field, Pagination, Status } from './components.jsx';
import { MOVEMENT_LABELS, formatUtc, money2 } from './format.js';
import { useList } from './hooks.js';

const FILTERS = ['type', 'dateFrom', 'dateTo', 'search', 'productId'];

export default function MovementsPage() {
  const [params, setParams] = useSearchParams();
  const applied = Object.fromEntries(FILTERS.map((name) => [name, params.get(name) || '']));
  const page = Number(params.get('page') || 1);
  const [draft, setDraft] = useState(applied);
  const list = useList('/movements', { ...applied, page, limit: 25 });

  function apply(event) {
    event.preventDefault();
    const next = {};
    FILTERS.forEach((name) => {
      if (draft[name]) {
        next[name] = draft[name];
      }
    });
    setParams(next);
  }

  function reset() {
    setDraft(Object.fromEntries(FILTERS.map((name) => [name, ''])));
    setParams({});
  }

  function goToPage(value) {
    setParams({ ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)), page: value });
  }

  const set = (name) => (event) => setDraft({ ...draft, [name]: event.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Movements</h1>
        <div className="actions">
          <Link className="button primary" to="/movements/new?type=receipt">
            New receipt
          </Link>
          <Link className="button primary" to="/movements/new?type=shipment">
            New shipment
          </Link>
          <Link className="button primary" to="/movements/new?type=write_off">
            New write-off
          </Link>
        </div>
      </div>
      <p className="muted">
        Posted movements are final: they cannot be edited, deleted or backdated. Dates are UTC calendar days.
      </p>

      <form className="toolbar filters" onSubmit={apply}>
        <Field label="Type">
          <select value={draft.type} onChange={set('type')}>
            <option value="">All types</option>
            {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From (UTC date)">
          <input type="date" value={draft.dateFrom} onChange={set('dateFrom')} />
        </Field>
        <Field label="To (UTC date)">
          <input type="date" value={draft.dateTo} onChange={set('dateTo')} />
        </Field>
        <Field label="Document number">
          <input value={draft.search} maxLength={20} onChange={set('search')} placeholder="RN-000001" />
        </Field>
        <button type="submit">Apply</button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </form>
      {applied.productId && (
        <p>
          Showing movements of product {applied.productId}. <Link to="/movements">Show all</Link>
        </p>
      )}

      <ErrorBox messages={list.error?.messages} />
      {!list.error && (
        <Status list={list} empty="No movements found.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Posted</th>
                  <th>Supplier / counterparty / reason</th>
                  <th className="num">Lines</th>
                  <th className="num">Value (UAH)</th>
                  <th>Created by</th>
                </tr>
              </thead>
              <tbody>
                {list.data?.items.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <Link to={`/movements/${movement.id}`}>{movement.number}</Link>
                    </td>
                    <td>{MOVEMENT_LABELS[movement.type]}</td>
                    <td>{formatUtc(movement.postedAt)}</td>
                    <td>{movement.partyName || movement.reason || '-'}</td>
                    <td className="num">{movement.lineCount}</td>
                    <td className="num">{money2(movement.totalValue)}</td>
                    <td>{movement.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Status>
      )}
      <Pagination data={list.data} page={page} onPage={goToPage} />
    </>
  );
}
