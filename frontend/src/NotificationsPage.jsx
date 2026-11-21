import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination, Status } from './components.jsx';
import { formatUtc } from './format.js';
import { useList } from './hooks.js';

export default function NotificationsPage() {
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const list = useList('/notifications', { status, page, limit: 25 });

  return (
    <>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <p className="muted">
        A low-stock notification appears when the quantity is less than or equal to the minimum stock. It is updated
        when stock changes and resolved when the quantity is above the minimum.
      </p>
      <div className="toolbar">
        <label className="check">
          Show
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      <Status list={list} empty="No notifications.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>SKU</th>
                <th>Product</th>
                <th className="num">Quantity</th>
                <th className="num">Min stock</th>
                <th>Updated</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((item) => (
                <tr key={item.id} className={item.status === 'resolved' ? 'archived' : undefined}>
                  <td>{item.status === 'active' ? 'Low stock' : 'Resolved'}</td>
                  <td>{item.product.sku}</td>
                  <td>
                    <Link to={`/movements?productId=${item.product.id}`}>{item.product.name}</Link>
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{item.minStock}</td>
                  <td>{formatUtc(item.updatedAt)}</td>
                  <td>{item.resolvedAt ? formatUtc(item.resolvedAt) : '-'}</td>
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
