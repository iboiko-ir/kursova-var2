import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination, ListState } from './components.jsx';
import { formatUtcDateTime } from './format.js';
import { useApiData } from './hooks.js';

export default function NotificationsPage() {
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const notificationList = useApiData('/notifications', { status, page, limit: 25 });

  return (
    <>
      <div className="page-head">
        <h1>Notifications</h1>
      </div>
      <p className="hint">A notification is resolved automatically when the quantity becomes greater than the minimum stock.</p>
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
      <ListState apiData={notificationList} emptyMessage="No notifications.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>SKU</th>
                <th>Product</th>
                <th className="num">Quantity</th>
                <th className="num">Min stock</th>
                <th className="num">Receive at least</th>
                <th>Updated</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {notificationList.data?.items.map((notification) => (
                <tr key={notification.id} className={notification.status === 'resolved' ? 'archived' : undefined}>
                  <td>{notification.status === 'active' ? 'Low stock' : 'Resolved'}</td>
                  <td>{notification.product.sku}</td>
                  <td>
                    <Link to={`/movements?productId=${notification.product.id}`}>{notification.product.name}</Link>
                  </td>
                  <td className="num">{notification.quantity}</td>
                  <td className="num">{notification.minStock}</td>
                  <td className="num">
                    {notification.status === 'active' ? notification.minStock - notification.quantity + 1 : '-'}
                  </td>
                  <td>{formatUtcDateTime(notification.updatedAt)}</td>
                  <td>{notification.resolvedAt ? formatUtcDateTime(notification.resolvedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListState>
      <Pagination data={notificationList.data} page={page} onPageChange={setPage} />
    </>
  );
}
