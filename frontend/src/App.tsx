import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import InvoiceList from "@/pages/invoices/InvoiceList";
import InvoiceCreate from "@/pages/invoices/InvoiceCreate";
import InvoiceDetail from "@/pages/invoices/InvoiceDetail";
import InvoiceEdit from "@/pages/invoices/InvoiceEdit";
import PaymentList from "@/pages/payments/PaymentList";
import PaymentCreate from "@/pages/payments/PaymentCreate";
import PaymentDetail from "@/pages/payments/PaymentDetail";
import TicketList from "@/pages/tickets/TicketList";
import TicketCreate from "@/pages/tickets/TicketCreate";
import TicketDetail from "@/pages/tickets/TicketDetail";
import PaymentMethodList from "@/pages/payment-methods/PaymentMethodList";
import PaymentMethodCreate from "@/pages/payment-methods/PaymentMethodCreate";
import PaymentMethodEdit from "@/pages/payment-methods/PaymentMethodEdit";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import PreferencesSettings from "@/pages/settings/PreferencesSettings";
import UserManagement from "@/pages/admin/UserManagement";
import ServiceProviderManagement from "@/pages/admin/ServiceProviderManagement";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Reports from "@/pages/admin/Reports";
import RoleManagement from "@/pages/admin/RoleManagement";
import PermissionManagement from "@/pages/admin/PermissionManagement";
import ServiceProviderRatings from "@/pages/ratings/ServiceProviderRatings";
import NotificationList from "@/pages/notifications/NotificationList";
import ActivityLogList from "@/pages/activity-logs/ActivityLogList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/invoices/create" element={<InvoiceCreate />} />
                <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/payments" element={<PaymentList />} />
                <Route path="/payments/create" element={<PaymentCreate />} />
                <Route path="/payments/:id" element={<PaymentDetail />} />
                <Route path="/tickets" element={<TicketList />} />
                <Route path="/tickets/create" element={<TicketCreate />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/payment-methods" element={<PaymentMethodList />} />
                <Route path="/payment-methods/create" element={<PaymentMethodCreate />} />
                <Route path="/payment-methods/:id/edit" element={<PaymentMethodEdit />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/settings/preferences" element={<PreferencesSettings />} />
                <Route path="/notifications" element={<NotificationList />} />
                <Route path="/activity-logs" element={<ActivityLogList />} />
                <Route path="/service-providers/:id/ratings" element={<ServiceProviderRatings />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/service-providers" element={<ServiceProviderManagement />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/roles" element={<RoleManagement />} />
                <Route path="/admin/permissions" element={<PermissionManagement />} />
              </Route>
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
