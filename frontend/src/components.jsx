export function ErrorBox({ messages }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <div className="error-box" role="alert">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Field({ label, errors, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {(errors || []).map((message) => (
        <span className="field-error" key={message}>
          {message}
        </span>
      ))}
    </label>
  );
}

export function Pagination({ data, page, onPageChange }) {
  if (!data) {
    return null;
  }
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages} ({data.total} records)
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

export function ListState({ apiData, emptyMessage, children }) {
  if (apiData.error) {
    return <ErrorBox messages={apiData.error.messages} />;
  }
  if (!apiData.data) {
    return <p className="muted">Loading...</p>;
  }
  if (apiData.data.items.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }
  return children;
}
