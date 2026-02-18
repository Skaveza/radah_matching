// src/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

type Role = "entrepreneur" | "professional" | "admin" | null;

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const RequireRole = ({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "entrepreneur" | "professional" | "admin";
}) => {
  const { user, loading, role: userRole, refreshMe } = useAuth();

  const [checkedRole, setCheckedRole] = useState(false);
  const [resolvedRole, setResolvedRole] = useState<Role>(userRole);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (loading) return;

      // Not logged in
      if (!user) {
        if (mounted) {
          setResolvedRole(null);
          setCheckedRole(true);
        }
        return;
      }

      // Role already known in context
      if (userRole) {
        if (mounted) {
          setResolvedRole(userRole);
          setCheckedRole(true);
        }
        return;
      }

      // Try once to fetch role from backend (/api/me)
      try {
        const me = await refreshMe();
        if (mounted) setResolvedRole((me?.role ?? null) as Role);
      } catch {
        // If backend fails temporarily, don't loop /choose-role infinitely.
        // We'll treat it as missing and allow choose-role redirect below.
        if (mounted) setResolvedRole(null);
      } finally {
        if (mounted) setCheckedRole(true);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [user, loading, userRole, refreshMe]);

  if (loading || !checkedRole) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  // If logged in but role truly missing -> choose-role
  if (!resolvedRole) return <Navigate to="/choose-role" replace />;

  // If route requires a specific role, enforce it
  if (role && resolvedRole !== role) return <Navigate to="/" replace />;

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/choose-role"
          element={
            <RequireAuth>
              <ChooseRole />
            </RequireAuth>
          }
        />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/professional-apply"
          element={
            <RequireRole role="professional">
              <ProfessionalApplication />
            </RequireRole>
          }
        />

        <Route
          path="/professional-dashboard"
          element={
            <RequireRole role="professional">
              <ProfessionalDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireRole role="entrepreneur">
              <Dashboard />
            </RequireRole>
          }
        />

        <Route
          path="/intake"
          element={
            <RequireRole role="entrepreneur">
              <Intake />
            </RequireRole>
          }
        />

        <Route
          path="/team-builder"
          element={
            <RequireRole role="entrepreneur">
              <TeamBuilder />
            </RequireRole>
          }
        />
        <Route
          path="/team-builder/:projectId"
          element={
            <RequireRole role="entrepreneur">
              <TeamBuilder />
            </RequireRole>
          }
        />

        <Route
          path="/team-preview"
          element={
            <RequireRole role="entrepreneur">
              <TeamPreview />
            </RequireRole>
          }
        />
        <Route
          path="/team-preview/:projectId"
          element={
            <RequireRole role="entrepreneur">
              <TeamPreview />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <Admin />
            </RequireRole>
          }
        />

        <Route path="/payment-success" element={<PaymentSuccess />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
