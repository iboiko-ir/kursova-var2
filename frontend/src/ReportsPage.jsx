import { useState } from 'react';
import { api } from './api.js';
import { ErrorBox, Field } from './components.jsx';
import { money2 } from './format.js';
import { useList } from './hooks.js';

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const REPORTS = {
  'inventory-as-of': 'Inventory as of a date',
  'movement-dynamics': 'Movement dynamics',
  'inventory-valuation': 'Inventory valuation',
};

function AsOfResult({ report }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="num">Quantity</th>
            <th className="num">Unit cost (UAH)</th>
            <th className="num">Value (UAH)</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((item) => (
            <tr key={item.productId}>
              <td>{item.sku}</td>
              <td>{item.name}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{money2(item.unitCost)}</td>
              <td className="num">{money2(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValuationResult({ report }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="num">Quantity</th>
            <th className="num">Value (UAH)</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((item) => (
            <tr key={item.productId}>
              <td>{item.sku}</td>
              <td>{item.name}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{money2(item.value)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={3} className="num">
              Total inventory value
            </th>
            <th className="num">{money2(report.totalValue)}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function DynamicsResult({ report }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date (UTC)</th>
            <th className="num">Received</th>
            <th className="num">Shipped</th>
            <th className="num">Written off</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((item) => (
            <tr key={item.date}>
              <td>{item.date}</td>
              <td className="num">{item.received}</td>
              <td className="num">{item.shipped}</td>
              <td className="num">{item.writtenOff}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th className="num">{report.totals.received}</th>
            <th className="num">{report.totals.shipped}</th>
            <th className="num">{report.totals.writtenOff}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const products = useList('/products', { limit: 200, includeArchived: true });
  const [name, setName] = useState('inventory-as-of');
  const [date, setDate] = useState(today());
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());
  const [productId, setProductId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const params = name === 'movement-dynamics' ? { dateFrom, dateTo, productId } : { date };
    try {
      setResult({ name, report: await api(`/reports/${name}`, { params }) });
    } catch (caught) {
      setError(caught);
    }
    setBusy(false);
  }

  return (
    <>
      <div className="page-head no-print">
        <h1>Reports</h1>
      </div>
      <form className="panel form wide no-print" onSubmit={run}>
        <p className="muted">
          Dates are UTC calendar days. A report for a date includes the whole day. Values are inventory costs in UAH.
        </p>
        <ErrorBox messages={error?.messages} />
        <div className="filters toolbar">
          <Field label="Report">
            <select value={name} onChange={(event) => setName(event.target.value)}>
              {Object.entries(REPORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {name === 'movement-dynamics' ? (
            <>
              <Field label="From (UTC date)">
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} required />
              </Field>
              <Field label="To (UTC date)">
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} required />
              </Field>
              <Field label="Product">
                <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                  <option value="">All products</option>
                  {(products.data?.items || []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <Field label="As of (UTC date)">
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </Field>
          )}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Running...' : 'Run report'}
          </button>
        </div>
      </form>

      {result && (
        <section className="report-result">
          <div className="page-head">
            <h2>
              {REPORTS[result.name]}
              {result.name === 'movement-dynamics'
                ? `: ${result.report.dateFrom} to ${result.report.dateTo}`
                : `: ${result.report.date}`}
            </h2>
            <button type="button" className="no-print" onClick={() => window.print()}>
              Print
            </button>
          </div>
          {result.report.items.length === 0 ? (
            <p className="muted">No data for these parameters.</p>
          ) : (
            <>
              {result.name === 'inventory-as-of' && <AsOfResult report={result.report} />}
              {result.name === 'inventory-valuation' && <ValuationResult report={result.report} />}
              {result.name === 'movement-dynamics' && <DynamicsResult report={result.report} />}
            </>
          )}
        </section>
      )}
    </>
  );
}
