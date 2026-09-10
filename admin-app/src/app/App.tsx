import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../pages/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { CustomerDetailPage } from '../features/customers/CustomerDetailPage';
import { DevicesPage } from '../features/devices/DevicesPage';
import { WorkOrdersPage } from '../features/work-orders/WorkOrdersPage';
import { NewWorkOrderPage } from '../features/work-orders/NewWorkOrderPage';
import { WorkOrderDetailPage } from '../features/work-orders/WorkOrderDetailPage';
import { PublicTrackingPage } from '../features/tracking/PublicTrackingPage';
import { ProductsPage } from '../features/commerce/ProductsPage';
import { ModulePage } from '../pages/ModulePage';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AgendaPage } from '../features/agenda/AgendaPage';
import { FinancePage } from '../features/finance/FinancePage';
import { SalesPage } from '../features/commerce/SalesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { StockPage } from '../features/commerce/StockPage';
import { UsersPage } from '../features/users/UsersPage';

export default function App() {
  return <ThemeProvider><AuthProvider><Routes>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route path="/acompanhar/:codigo" element={<PublicTrackingPage />} />
    <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="clientes" element={<CustomersPage />} />
      <Route path="clientes/:id" element={<CustomerDetailPage />} />
      <Route path="aparelhos" element={<DevicesPage />} />
      <Route path="agenda" element={<AgendaPage />} />
      <Route path="produtos" element={<ProductsPage />} />
      <Route path="estoque" element={<StockPage />} />
      <Route path="vendas" element={<SalesPage />} />
      <Route path="financeiro" element={<FinancePage />} />
      <Route path="relatorios" element={<ReportsPage />} />
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="configuracoes" element={<SettingsPage />} />
      <Route path="comandas" element={<WorkOrdersPage />} />
      <Route path="comandas/nova" element={<NewWorkOrderPage />} />
      <Route path="comandas/:id" element={<WorkOrderDetailPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes></AuthProvider></ThemeProvider>;
}
