import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/auth-context";
import { ProtectedRoute } from "./routes/protected-route";
import { DashboardLayout } from "./components/layout/dashboard-layout";

// Auth Pages
import { LoginPage } from "./pages/auth/login-page";
import { RegisterPage } from "./pages/auth/register-page";
import { ForgotPasswordPage } from "./pages/auth/forgot-password-page";
import { ResetPasswordPage } from "./pages/auth/reset-password-page";
import { VerifyEmailPage } from "./pages/auth/verify-email-page";

// Dashboard Pages

import { ProfilePage } from "./pages/profile-page";
import { ItemsPage } from "./pages/items-page";
import { ItemDetailsPage } from "./pages/item-details-page";
import { ItemForm } from "./components/items/item-form";
import { TransactionsPage } from "./pages/transactions-page";
import { TransactionDetailsPage } from "./pages/transaction-details-page";
import { ShopPage } from "./pages/shop-page";
import { ProductDetailsPage } from "./pages/product-details-page";
import { ReportsPage } from "./pages/reports-page";

// Admin Pages
import { AdminUsersPage } from "./pages/admin/users-page";
import { AdminUserFormPage } from "./pages/admin/users-form-page";
import { MyTransactionsPage } from "./pages/my-transaction-page";
import { UserManagement } from "./pages/admin/user-management";
import DashboardPage from "./pages/dashboard-page";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Group Dashboard Routes inside DashboardLayout */}
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Inventory Routes */}
                <Route path="items" element={<ItemsPage />} />
                <Route path="items/new" element={<ItemForm />} />
                <Route path="items/:id" element={<ItemDetailsPage />} />
                <Route path="items/:id/edit" element={<ItemForm isEdit />} />

                {/* Transaction Routes */}
                <Route path="transactions" element={<TransactionsPage />} />
                <Route
                  path="my-transactions"
                  element={<MyTransactionsPage />}
                />
                <Route
                  path="transactions/:id"
                  element={<TransactionDetailsPage />}
                />

                {/* Shop Routes */}
                <Route path="shop" element={<ShopPage />} />
                <Route path="shop/:id" element={<ProductDetailsPage />} />

                {/* Reports Routes */}
                <Route path="reports" element={<ReportsPage />} />

                {/* Admin Routes */}
                <Route path="admin">
                  {/* <Route path="users" element={<AdminUsersPage />} /> */}
                  <Route path="users" element={<UserManagement />} />
                  <Route path="users/new" element={<AdminUserFormPage />} />
                  <Route
                    path="users/:id/edit"
                    element={<AdminUserFormPage isEdit />}
                  />
                </Route>
              </Route>
            </Route>

            {/* Catch all - Redirect to dashboard if no route matches */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
