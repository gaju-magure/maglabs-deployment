
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Login } from "@/pages/Login";
import { TenantsPage } from "@/pages/SuperAdmin/TenantsPage";
import { OnboardingPage } from "@/pages/SuperAdmin/OnboardingPage";
import { ContentWallPage } from "@/pages/TenantAdmin/ContentWallPage";
import { IdeasPage } from "@/pages/TenantUser/IdeasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Super Admin Routes */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="tenants" element={<TenantsPage />} />
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="settings" element={
                      <div className="p-8 text-center text-gray-600">
                        Site Settings page - Coming soon
                      </div>
                    } />
                    <Route path="*" element={<Navigate to="/dashboard/tenants" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Tenant Admin Routes */}
            <Route path="/tenant/*" element={
              <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_user']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="content" element={<ContentWallPage />} />
                    <Route path="users" element={
                      <div className="p-8 text-center text-gray-600">
                        User Management page - Coming soon
                      </div>
                    } />
                    <Route path="ideas" element={<IdeasPage />} />
                    <Route path="*" element={<Navigate to="/tenant/content" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Unauthorized page */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4 text-gray-900">Unauthorized</h1>
                  <p className="text-xl text-gray-600">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            {/* 404 page */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
                  <p className="text-xl text-gray-600">Page not found</p>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
