import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import Layout from './Layout.jsx';
import LoginPage from './LoginPage.jsx';
import PartiesPage from './PartiesPage.jsx';
import ProductsPage from './ProductsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route
              path="/suppliers"
              element={<PartiesPage key="suppliers" title="Suppliers" singular="supplier" path="/suppliers" />}
            />
            <Route
              path="/counterparties"
              element={
                <PartiesPage key="counterparties" title="Counterparties" singular="counterparty" path="/counterparties" />
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
