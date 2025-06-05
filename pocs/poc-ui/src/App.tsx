
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/auth/LoginForm";
import { MainLayout } from "./components/layout/MainLayout";
import { EmployeeDashboard } from "./components/dashboards/EmployeeDashboard";
import { ExecutiveDashboard } from "./components/dashboards/ExecutiveDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";
import { SubmitIdea } from "./pages/SubmitIdea";
import { MyIdeas } from "./pages/MyIdeas";
import { ContentWall } from "./pages/ContentWall";
import { Leaderboard } from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  switch (user.role) {
    case 'employee':
      return <EmployeeDashboard />;
    case 'executive':
      return <ExecutiveDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route path="dashboard" element={<DashboardRouter />} />
                <Route path="submit-idea" element={<SubmitIdea />} />
                <Route path="my-ideas" element={<MyIdeas />} />
                <Route path="content-wall" element={<ContentWall />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
