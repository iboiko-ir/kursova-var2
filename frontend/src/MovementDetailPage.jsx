import { Link, useParams } from 'react-router-dom';
import { ErrorBox } from './components.jsx';
import { DOCUMENT_TITLES, formatUtcDateTime, formatMoney } from './format.js';
import { useApiData } from './hooks.js';

function PartyRow({ label, party }) {
  if (!party) {
    return null;
  }
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {party.name}
        {party.contactDetails && <div className="muted">{party.contactDetails}</div>}
      </td>
    </tr>
  );
}

export default function MovementDetailPage() {
  const { id } = useParams();
  const detail = useApiData(`/movements/${id}`, {});
  const movement = detail.data;

  return (
    <>
      <div className="page-head no-print">
        <h1>{movement ? `${DOCUMENT_TITLES[movement.type]} ${movement.number}` : 'Movement'}</h1>
        <div className="actions">
          {movement && (
            <button type="button" className="primary" onClick={() => window.print()}>
              Print
            </button>
          )}
          <Link className="button" to="/movements">
            Back to movements
          </Link>
        </div>
      </div>
      <ErrorBox messages={detail.error?.messages} />
      {!movement && !detail.error && <p className="muted">Loading...</p>}
      {movement && (
        <article className="document">
          <header className="document-title">
            <div className="document-brand">kursova</div>
            <h2>{DOCUMENT_TITLES[movement.type]}</h2>
            <div>No. {movement.number}</div>
          </header>
          <div className="panel">
            <table className="details">
              <tbody>
                <tr>
                  <th scope="row">Document number</th>
                  <td>{movement.number}</td>
                </tr>
                <tr>
                  <th scope="row">Date and time</th>
                  <td>{formatUtcDateTime(movement.postedAt)}</td>
                </tr>
                <PartyRow label="Supplier" party={movement.supplier} />
                <PartyRow label="Counterparty" party={movement.counterparty} />
                {movement.reason && (
                  <tr>
                    <th scope="row">Reason</th>
                    <td>{movement.reason}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row">Created by</th>
                  <td>{movement.createdBy}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="num">Quantity</th>
                  <th className="num">Unit cost (UAH)</th>
                  <th className="num">Value (UAH)</th>
                </tr>
              </thead>
              <tbody>
                {movement.lines.map((line, index) => (
                  <tr key={line.productId}>
                    <td>{index + 1}</td>
                    <td>{line.sku}</td>
                    <td>{line.productName}</td>
                    <td className="num">{line.quantity}</td>
                    <td className="num">{formatMoney(line.unitCost)}</td>
                    <td className="num">{formatMoney(line.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={5} className="num">
                    Total
                  </th>
                  <th className="num">{formatMoney(movement.totalValue)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="signatures print-only">
            <div>Issued by: {movement.createdBy}</div>
            <div>Accepted by: ______________________</div>
          </div>
          <p className="muted no-print">
            This document is posted and final. Names, SKUs, parties and costs are stored as they were at posting time.
          </p>
        </article>
      )}
    </>
  );
}
