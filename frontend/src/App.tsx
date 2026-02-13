import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ChooseRole from "@/pages/ChooseRole";
import Dashboard from "@/pages/EntrepreneurDashboard";
import ProfessionalDashboard from "@/pages/ProfessionalDashboard";
import ProfessionalLogin from "@/pages/ProfessionalLogin";
import ProfessionalApplication from "@/pages/ProfessionalApplication";
import Intake from "@/pages/Intake";
import TeamBuilder from "@/pages/Recommendation";
import TeamPreview from "@/pages/TeamPreview";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Admin from "@/pages/Admin";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "entrepreneur" | "professional" | "admin";
}) => {
  const { user, loading, role: userRole } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  // if backend profile missing, force choose role
  if (!userRole) return <Navigate to="/choose-role" replace />;

  if (role && userRole !== role) return <Navigate to="/" replace />;

  return children;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Professional */}
              <Route path="/professional-login" element={<ProfessionalLogin />} />
              <Route path="/professional-apply" element={<ProfessionalApplication />} />
              <Route
                path="/professional-dashboard"
                element={
                  <ProtectedRoute role="professional">
                    <ProfessionalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Entrepreneur */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute role="entrepreneur">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/intake"
                element={
                  <ProtectedRoute role="entrepreneur">
                    <Intake />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-builder"
                element={
                  <ProtectedRoute role="entrepreneur">
                    <TeamBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-preview"
                element={
                  <ProtectedRoute role="entrepreneur">
                    <TeamPreview />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Payments */}
              <Route path="/payment-success" element={<PaymentSuccess />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
