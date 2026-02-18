import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ChooseRole from "@/pages/ChooseRole";
import Profile from "@/pages/Profile";

import Dashboard from "@/pages/EntrepreneurDashboard";
import ProfessionalDashboard from "@/pages/ProfessionalDashboard";
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

const ProtectedRoute = ({
  children,
  role,
  requireRole = true,
}: {
  children: JSX.Element;
  role?: "entrepreneur" | "professional" | "admin";
  requireRole?: boolean;
}) => {
  const { user, loading, role: userRole } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  // Only require a role when requireRole is true
  if (requireRole && !userRole) return <Navigate to="/choose-role" replace />;

  // role-based lock (only if role was provided)
  if (role && userRole !== role) return <Navigate to="/" replace />;

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Allow logged-in users without a role to access choose-role */}
        <Route
          path="/choose-role"
          element={
            <ProtectedRoute requireRole={false}>
              <ChooseRole />
            </ProtectedRoute>
          }
        />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/professional-apply" element={<ProfessionalApplication />} />

        <Route
          path="/professional-dashboard"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />

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
          path="/team-builder/:projectId"
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
        <Route
          path="/team-preview/:projectId"
          element={
            <ProtectedRoute role="entrepreneur">
              <TeamPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
