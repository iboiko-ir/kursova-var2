import { Link, useParams } from 'react-router-dom';
import { ErrorBox } from './components.jsx';
import { MOVEMENT_LABELS, formatUtc, money2 } from './format.js';
import { useList } from './hooks.js';

function PartyBlock({ label, party }) {
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
  const detail = useList(`/movements/${id}`, {});
  const movement = detail.data;

  return (
    <>
      <div className="page-head">
        <h1>{movement ? `${MOVEMENT_LABELS[movement.type]} ${movement.number}` : 'Movement'}</h1>
        <Link to="/movements">Back to movements</Link>
      </div>
      <ErrorBox messages={detail.error?.messages} />
      {!movement && !detail.error && <p className="muted">Loading...</p>}
      {movement && (
        <>
          <div className="panel">
            <table className="details">
              <tbody>
                <tr>
                  <th scope="row">Document number</th>
                  <td>{movement.number}</td>
                </tr>
                <tr>
                  <th scope="row">Posted</th>
                  <td>{formatUtc(movement.postedAt)}</td>
                </tr>
                <PartyBlock label="Supplier" party={movement.supplier} />
                <PartyBlock label="Counterparty" party={movement.counterparty} />
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
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="num">Quantity</th>
                  <th className="num">Unit cost (UAH)</th>
                  <th className="num">Value (UAH)</th>
                </tr>
              </thead>
              <tbody>
                {movement.lines.map((line) => (
                  <tr key={line.productId}>
                    <td>{line.sku}</td>
                    <td>{line.productName}</td>
                    <td className="num">{line.quantity}</td>
                    <td className="num">{money2(line.unitCost)}</td>
                    <td className="num">{money2(line.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4} className="num">
                    Total
                  </th>
                  <th className="num">{money2(movement.totalValue)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="muted">
            This document is posted and final. Names, SKUs, parties and costs are stored as they were at posting time.
          </p>
        </>
      )}
    </>
  );
}
