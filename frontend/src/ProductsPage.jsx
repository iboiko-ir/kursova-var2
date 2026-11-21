import { useState } from 'react';
import { api, fieldErrors } from './api.js';
import { useAuth } from './auth.jsx';
import { ErrorBox, Field, Pagination, Status } from './components.jsx';
import { useDebounced, useList } from './hooks.js';

const FIELDS = ['name', 'sku', 'supplierId', 'catalogPrice', 'minStock'];

function ProductForm({ initial, suppliers, onSaved, onCancel }) {
  const [values, setValues] = useState({
    name: initial.name,
    sku: initial.sku,
    supplierId: initial.supplier ? String(initial.supplier.id) : '',
    catalogPrice: initial.catalogPrice,
    minStock: String(initial.minStock),
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { fields, general } = fieldErrors(error, FIELDS);
  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });

  const options = [...suppliers];
  if (initial.supplier && !options.some((supplier) => supplier.id === initial.supplier.id)) {
    options.push(initial.supplier);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name: values.name,
      sku: values.sku,
      supplierId: values.supplierId === '' ? undefined : Number(values.supplierId),
      catalogPrice: values.catalogPrice.trim(),
      minStock: values.minStock.trim() === '' ? undefined : Number(values.minStock),
    };
    try {
      if (initial.id) {
        await api(`/products/${initial.id}`, { method: 'PATCH', body });
      } else {
        await api('/products', { method: 'POST', body });
      }
      onSaved();
    } catch (caught) {
      setError(caught);
      setBusy(false);
    }
  }

  return (
    <form className="panel form form-grid" onSubmit={submit}>
      <h2>{initial.id ? 'Edit product' : 'New product'}</h2>
      <div className="full">
        <ErrorBox messages={general} />
      </div>
      <Field label="Name" errors={fields.name}>
        <input value={values.name} maxLength={150} onChange={set('name')} required />
      </Field>
      <Field label="SKU" errors={fields.sku}>
        <input value={values.sku} maxLength={50} onChange={set('sku')} required />
      </Field>
      <Field label="Supplier" errors={fields.supplierId}>
        <select value={values.supplierId} onChange={set('supplierId')} required>
          <option value="">Select a supplier</option>
          {options.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
              {supplier.archived ? ' (archived)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Catalog price (UAH)" errors={fields.catalogPrice}>
        <input value={values.catalogPrice} inputMode="decimal" onChange={set('catalogPrice')} required />
      </Field>
      <Field label="Minimum stock" errors={fields.minStock}>
        <input value={values.minStock} inputMode="numeric" onChange={set('minStock')} required />
      </Field>
      <p className="muted full">Quantity starts at zero and changes only through goods receipts.</p>
      <div className="actions full">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save product'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState(null);
  const debouncedSearch = useDebounced(search);
  const list = useList('/products', { page, limit: 25, search: debouncedSearch.trim(), includeArchived });
  const suppliers = useList('/suppliers', { limit: 200 });

  async function toggleArchive(product) {
    const action = product.archived ? 'restore' : 'archive';
    if (
      !product.archived &&
      !window.confirm(`Archive product "${product.name}"? It will be hidden from new movements. History is kept.`)
    ) {
      return;
    }
    setActionError(null);
    try {
      await api(`/products/${product.id}/${action}`, { method: 'POST' });
      list.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        {isAdmin && !editing && (
          <button
            type="button"
            className="primary"
            disabled={!suppliers.data}
            onClick={() => setEditing({ name: '', sku: '', catalogPrice: '', minStock: '0' })}
          >
            New product
          </button>
        )}
      </div>

      {editing && (
        <ProductForm
          key={editing.id || 'new'}
          initial={editing}
          suppliers={suppliers.data?.items || []}
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
          placeholder="Search by name or SKU"
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
      <Status list={list} empty="No products found.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Supplier</th>
                <th className="num">Price (UAH)</th>
                <th className="num">Quantity</th>
                <th className="num">Min stock</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((product) => (
                <tr key={product.id} className={product.archived ? 'archived' : undefined}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.supplier.name}</td>
                  <td className="num">{product.catalogPrice}</td>
                  <td className="num">{product.quantity}</td>
                  <td className="num">{product.minStock}</td>
                  <td>{product.archived ? 'Archived' : 'Active'}</td>
                  {isAdmin && (
                    <td className="row-actions">
                      <button type="button" onClick={() => setEditing(product)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleArchive(product)}>
                        {product.archived ? 'Restore' : 'Archive'}
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
