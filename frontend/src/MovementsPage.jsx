import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ErrorBox, Field, Pagination, ListState } from './components.jsx';
import { MOVEMENT_LABELS, formatUtcDateTime, formatMoney } from './format.js';
import { useApiData } from './hooks.js';

const FILTERS = ['type', 'dateFrom', 'dateTo', 'search', 'productId'];

export default function MovementsPage() {
  const [queryParameters, setQueryParameters] = useSearchParams();
  const appliedFilters = Object.fromEntries(FILTERS.map((name) => [name, queryParameters.get(name) || '']));
  const page = Number(queryParameters.get('page') || 1);
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const queryString = queryParameters.toString();

  useEffect(() => {
    setDraftFilters(Object.fromEntries(FILTERS.map((name) => [name, queryParameters.get(name) || ''])));
  }, [queryString]);
  const movementList = useApiData('/movements', { ...appliedFilters, page, limit: 25 });

  function apply(event) {
    event.preventDefault();
    const next = {};
    FILTERS.forEach((name) => {
      if (draftFilters[name]) {
        next[name] = draftFilters[name];
      }
    });
    setQueryParameters(next);
  }

  function reset() {
    setDraftFilters(Object.fromEntries(FILTERS.map((name) => [name, ''])));
    setQueryParameters({});
  }

  function goToPage(pageNumber) {
    setQueryParameters({ ...Object.fromEntries(Object.entries(appliedFilters).filter(([, filterValue]) => filterValue)), page: pageNumber });
  }

  const setFilter = (name) => (event) => setDraftFilters({ ...draftFilters, [name]: event.target.value });

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

      <form className="toolbar filters" onSubmit={apply}>
        <Field label="Type">
          <select value={draftFilters.type} onChange={setFilter('type')}>
            <option value="">All types</option>
            {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From (UTC date)">
          <input type="date" value={draftFilters.dateFrom} onChange={setFilter('dateFrom')} />
        </Field>
        <Field label="To (UTC date)">
          <input type="date" value={draftFilters.dateTo} onChange={setFilter('dateTo')} />
        </Field>
        <Field label="Document number">
          <input value={draftFilters.search} maxLength={20} onChange={setFilter('search')} placeholder="RN-000001" />
        </Field>
        <button type="submit">Apply</button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </form>
      {appliedFilters.productId && (
        <p>
          Showing movements of product {appliedFilters.productId}. <Link to="/movements">Show all</Link>
        </p>
      )}

      <ErrorBox messages={movementList.error?.messages} />
      {!movementList.error && (
        <ListState apiData={movementList} emptyMessage="No movements found.">
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
                {movementList.data?.items.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <Link to={`/movements/${movement.id}`}>{movement.number}</Link>
                    </td>
                    <td>{MOVEMENT_LABELS[movement.type]}</td>
                    <td>{formatUtcDateTime(movement.postedAt)}</td>
                    <td>{movement.partyName || movement.reason || '-'}</td>
                    <td className="num">{movement.lineCount}</td>
                    <td className="num">{formatMoney(movement.totalValue)}</td>
                    <td>{movement.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ListState>
      )}
      <Pagination data={movementList.data} page={page} onPageChange={goToPage} />
    </>
  );
}
