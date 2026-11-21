import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import Layout from './Layout.jsx';
import LoginPage from './LoginPage.jsx';
import MovementDetailPage from './MovementDetailPage.jsx';
import MovementsPage from './MovementsPage.jsx';
import NewMovementPage from './NewMovementPage.jsx';
import NotificationsPage from './NotificationsPage.jsx';
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
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/movements/new" element={<NewMovementPage />} />
            <Route path="/movements/:id" element={<MovementDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
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
