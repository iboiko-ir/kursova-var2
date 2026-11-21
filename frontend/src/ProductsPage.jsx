import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, groupFieldErrors } from './api.js';
import { useAuth } from './auth.jsx';
import { ErrorBox, Field, Pagination, ListState } from './components.jsx';
import { formatMoney } from './format.js';
import { useDebouncedValue, useApiData } from './hooks.js';

const FORM_FIELDS = ['name', 'sku', 'supplierId', 'catalogPrice', 'minStock', 'initialQuantity'];

function ProductForm({ initialProduct, suppliers, onSaved, onCancel }) {
  const [values, setValues] = useState({
    name: initialProduct.name,
    sku: initialProduct.sku,
    supplierId: initialProduct.supplier ? String(initialProduct.supplier.id) : '',
    catalogPrice: initialProduct.catalogPrice,
    minStock: String(initialProduct.minStock),
    initialQuantity: '0',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { fields, general } = groupFieldErrors(error, FORM_FIELDS);
  const setValue = (name) => (event) => setValues({ ...values, [name]: event.target.value });

  const options = [...suppliers];
  if (initialProduct.supplier && !options.some((supplier) => supplier.id === initialProduct.supplier.id)) {
    options.push(initialProduct.supplier);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const body = {
      name: values.name,
      sku: values.sku,
      supplierId: values.supplierId === '' ? undefined : Number(values.supplierId),
      catalogPrice: values.catalogPrice.trim(),
      minStock: values.minStock.trim() === '' ? undefined : Number(values.minStock),
    };
    if (!initialProduct.id) {
      body.initialQuantity = values.initialQuantity.trim() === '' ? undefined : Number(values.initialQuantity);
    }
    try {
      if (initialProduct.id) {
        await apiRequest(`/products/${initialProduct.id}`, { method: 'PATCH', body });
      } else {
        await apiRequest('/products', { method: 'POST', body });
      }
      onSaved();
    } catch (caught) {
      setError(caught);
      setSubmitting(false);
    }
  }

  return (
    <form className="panel form form-grid" onSubmit={submit}>
      <h2>{initialProduct.id ? 'Edit product' : 'New product'}</h2>
      <div className="full">
        <ErrorBox messages={general} />
      </div>
      <Field label="Name" errors={fields.name}>
        <input value={values.name} maxLength={150} onChange={setValue('name')} required />
      </Field>
      <Field label="SKU" errors={fields.sku}>
        <input value={values.sku} maxLength={50} onChange={setValue('sku')} required />
      </Field>
      <Field label="Supplier" errors={fields.supplierId}>
        <select value={values.supplierId} onChange={setValue('supplierId')} required>
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
        <input value={values.catalogPrice} inputMode="decimal" onChange={setValue('catalogPrice')} required />
      </Field>
      <Field label="Minimum stock" errors={fields.minStock}>
        <input value={values.minStock} inputMode="numeric" onChange={setValue('minStock')} required />
      </Field>
      {!initialProduct.id && (
        <Field label="Initial quantity" errors={fields.initialQuantity}>
          <input value={values.initialQuantity} inputMode="numeric" onChange={setValue('initialQuantity')} />
        </Field>
      )}
      {!initialProduct.id && (
        <p className="hint full">The initial quantity is posted as a goods receipt at the catalog price.</p>
      )}
      <div className="actions full">
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save product'}
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
  const debouncedSearch = useDebouncedValue(search);
  const productList = useApiData('/products', { page, limit: 25, search: debouncedSearch.trim(), includeArchived });
  const suppliers = useApiData('/suppliers', { limit: 200 });

  async function deleteProduct(product) {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
      return;
    }
    setActionError(null);
    try {
      await apiRequest(`/products/${product.id}`, { method: 'DELETE' });
      productList.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

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
      await apiRequest(`/products/${product.id}/${action}`, { method: 'POST' });
      productList.reload();
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
          initialProduct={editing}
          suppliers={suppliers.data?.items || []}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            productList.reload();
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
      <ListState apiData={productList} emptyMessage="No products found.">
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
                <th className="num">Inventory value (UAH)</th>
                <th>Status</th>
                <th>Movements</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {productList.data?.items.map((product) => (
                <tr key={product.id} className={product.archived ? 'archived' : undefined}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.supplier.name}</td>
                  <td className="num">{product.catalogPrice}</td>
                  <td className="num">{product.quantity}</td>
                  <td className="num">{product.minStock}</td>
                  <td className="num">{formatMoney(product.inventoryValue)}</td>
                  <td>
                    {product.archived ? 'Archived' : 'Active'}
                    {!product.archived && product.quantity <= product.minStock && <strong> - Low stock</strong>}
                  </td>
                  <td>
                    <Link to={`/movements?productId=${product.id}`}>History</Link>
                  </td>
                  {isAdmin && (
                    <td className="row-actions">
                      <button type="button" onClick={() => setEditing(product)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleArchive(product)}>
                        {product.archived ? 'Restore' : 'Archive'}
                      </button>
                      <button type="button" onClick={() => deleteProduct(product)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListState>
      <Pagination data={productList.data} page={page} onPageChange={setPage} />
    </>
  );
}
