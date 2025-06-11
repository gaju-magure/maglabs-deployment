import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";

import { Login } from "@/pages/Login";
import { TenantsPage } from "@/pages/Dashboard/TenantsPage";
import { UsersPage } from "@/pages/Dashboard/UsersPage";
import { ContentWallPage } from "@/pages/Dashboard/ContentWallPage";
import { IdeasPage } from "@/pages/Dashboard/IdeasPage";
import { OrganizationPage } from "@/pages/Dashboard/OrganizationPage";
import { TenantOnboarding } from "@/pages/TenantOnboarding";

const queryClient = new QueryClient();

const RoleAwareDashboardRoutes = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getDefaultRoute = () => {
    switch (user.role) {
      case "superadmin":
        return "/dashboard/tenants";
      case "tenant_admin":
        return "/dashboard/content";
      case "tenant_user":
        return "/dashboard/ideas";
      default:
        return "/unauthorized";
    }
  };

  return (
    <DashboardLayout>
      <Routes>
        {/* Default redirection for bare /dashboard */}
        <Route index element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Super Admin Routes */}
        {user.role === "superadmin" && (
          <>
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={
              <div className="p-8 text-center text-gray-600">
                Site Settings page - Coming soon
              </div>
            } />
            <Route path="*" element={<Navigate to="/dashboard/tenants" replace />} />
          </>
        )}

        {/* Tenant Admin Routes */}
        {user.role === "tenant_admin" && (
          <>
            <Route path="content" element={<ContentWallPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="organization" element={<OrganizationPage />} />
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="*" element={<Navigate to="/dashboard/content" replace />} />
          </>
        )}

        {/* Tenant User Routes */}
        {user.role === "tenant_user" && (
          <>
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="*" element={<Navigate to="/dashboard/ideas" replace />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Public onboarding route */}
            <Route path="/onboarding/:token" element={<TenantOnboarding />} />

            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "tenant_admin", "tenant_user"]}>
                  <RoleAwareDashboardRoutes />
                </ProtectedRoute>
              }
            />

            {/* Unauthorized */}
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">Unauthorized</h1>
                    <p className="text-xl text-gray-600">You don't have permission to access this page.</p>
                  </div>
                </div>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
                    <p className="text-xl text-gray-600">Page not found</p>
                  </div>
                </div>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
