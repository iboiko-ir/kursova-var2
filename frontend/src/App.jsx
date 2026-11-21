import { useEffect, useState } from 'react';

function useApiHealth() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        setState({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ loading: false, data: null, error: error.message });
        }
      });
    return () => controller.abort();
  }, []);

  return state;
}

export default function App() {
  const health = useApiHealth();

  return (
    <>
      <header className="topbar">
        <span className="brand">kursova</span>
      </header>
      <main className="content">
        <h1>Warehouse inventory</h1>
        <section className="panel" aria-labelledby="status-title">
          <h2 id="status-title">System status</h2>
          {health.loading && <p>Checking API...</p>}
          {health.error && (
            <p className="status-error" role="alert">
              API unavailable: {health.error}
            </p>
          )}
          {health.data && (
            <table>
              <tbody>
                <tr>
                  <th scope="row">API</th>
                  <td>{health.data.status}</td>
                </tr>
                <tr>
                  <th scope="row">Database</th>
                  <td>{health.data.database}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>
        <section className="panel" aria-labelledby="docs-title">
          <h2 id="docs-title">API documentation</h2>
          <ul>
            <li>
              <a href="/api/docs">Swagger UI</a>
            </li>
            <li>
              <a href="/api/openapi.json">OpenAPI JSON</a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
