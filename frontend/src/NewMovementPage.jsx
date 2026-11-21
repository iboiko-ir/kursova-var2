import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from './api.js';
import { ErrorBox, Field } from './components.jsx';
import { MOVEMENT_LABELS } from './format.js';
import { useApiData } from './hooks.js';

let lastLineKey = 0;
const emptyLine = () => ({ key: (lastLineKey += 1), productId: '', quantity: '1', unitCost: '' });

export default function NewMovementPage() {
  const [params] = useSearchParams();
  const type = params.get('type');
  const navigate = useNavigate();
  const products = useApiData('/products', { limit: 200 });
  const suppliers = useApiData('/suppliers', { limit: 200 });
  const counterparties = useApiData('/counterparties', { limit: 200 });
  const [partyId, setPartyId] = useState('');
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!MOVEMENT_LABELS[type]) {
    return <Navigate to="/movements" replace />;
  }

  const isReceipt = type === 'receipt';
  const productItems = products.data?.items || [];
  const parties = (isReceipt ? suppliers : counterparties).data?.items || [];
  const findProduct = (id) => productItems.find((product) => String(product.id) === String(id));

  function updateLine(key, changes) {
    setLines(lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  }

  function chooseProduct(key, productId) {
    const product = findProduct(productId);
    updateLine(key, { productId, unitCost: isReceipt && product ? product.catalogPrice : '' });
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const body = {
      type,
      lines: lines.map((line) => ({
        productId: line.productId === '' ? undefined : Number(line.productId),
        quantity: line.quantity.trim() === '' ? undefined : Number(line.quantity),
        ...(isReceipt && line.unitCost.trim() !== '' ? { unitCost: line.unitCost.trim() } : {}),
      })),
    };
    if (isReceipt) {
      body.supplierId = partyId === '' ? undefined : Number(partyId);
    } else if (type === 'shipment') {
      body.counterpartyId = partyId === '' ? undefined : Number(partyId);
    } else {
      body.reason = reason;
    }
    try {
      const posted = await apiRequest('/movements', { method: 'POST', body });
      navigate(`/movements/${posted.id}`);
    } catch (caught) {
      setError(caught);
      setSubmitting(false);
    }
  }

  const selectedProductIds = new Set(lines.map((line) => String(line.productId)));

  return (
    <>
      <div className="page-head">
        <h1>New {MOVEMENT_LABELS[type].toLowerCase()}</h1>
        <Link to="/movements">Back to movements</Link>
      </div>
      <form className="panel form wide" onSubmit={submit}>
        <p className="hint">The document is posted immediately. A posted document cannot be edited or deleted.</p>
        <ErrorBox messages={error?.messages} />

        {isReceipt && (
          <Field label="Supplier">
            <select value={partyId} onChange={(event) => setPartyId(event.target.value)} required>
              <option value="">Select a supplier</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {type === 'shipment' && (
          <Field label="Counterparty">
            <select value={partyId} onChange={(event) => setPartyId(event.target.value)} required>
              <option value="">Select a counterparty</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {type === 'write_off' && (
          <Field label="Reason">
            <textarea
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </Field>
        )}

        <div className="table-wrap lines">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                {!isReceipt && <th className="num">In stock</th>}
                <th className="num">Quantity</th>
                {isReceipt && <th className="num">Unit cost (UAH)</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const product = findProduct(line.productId);
                return (
                  <tr key={line.key}>
                    <td>
                      <select
                        aria-label="Product"
                        value={line.productId}
                        onChange={(event) => chooseProduct(line.key, event.target.value)}
                        required
                      >
                        <option value="">Select a product</option>
                        {productItems.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={selectedProductIds.has(String(item.id)) && String(item.id) !== String(line.productId)}
                          >
                            {item.sku} - {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    {!isReceipt && <td className="num">{product ? product.quantity : '-'}</td>}
                    <td className="num">
                      <input
                        aria-label="Quantity"
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                        required
                      />
                    </td>
                    {isReceipt && (
                      <td className="num">
                        <input
                          aria-label="Unit cost"
                          inputMode="decimal"
                          value={line.unitCost}
                          onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
                        />
                      </td>
                    )}
                    <td>
                      <button
                        type="button"
                        disabled={lines.length === 1}
                        onClick={() => setLines(lines.filter((item) => item.key !== line.key))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="actions">
          <button type="button" onClick={() => setLines([...lines, emptyLine()])}>
            Add line
          </button>
        </div>

        <div className="actions">
          <button type="submit" className="primary" disabled={submitting || !products.data}>
            {submitting ? 'Posting...' : `Post ${MOVEMENT_LABELS[type].toLowerCase()}`}
          </button>
          <Link className="button" to="/movements">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
