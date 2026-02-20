// src/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
type RoleState = Role | undefined;

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

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
  const [resolvedRole, setResolvedRole] = useState<RoleState>(undefined);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      console.log("[RequireRole] run()", { loading, user: !!user, userRole });

      if (loading) return;

      if (!user) {
        if (mounted) setResolvedRole(null);
        return;
      }

      if (userRole) {
        console.log("[RequireRole] role from context:", userRole);
        if (mounted) setResolvedRole(userRole as Role);
        return;
      }

      console.log("[RequireRole] no role in context, calling refreshMe...");

      try {
        const me = await refreshMe();
        console.log("[RequireRole] refreshMe returned:", me);
        if (mounted) setResolvedRole((me?.role ?? null) as Role);
      } catch (e) {
        console.error("[RequireRole] refreshMe threw:", e);
        // Backend error — send to login rather than hanging forever
        if (mounted) setResolvedRole(null);
      }
    };

    run();
    return () => { mounted = false; };
  }, [user, loading, userRole, refreshMe]);

  console.log("[RequireRole] render", { resolvedRole, loading, userRole });

  if (loading || resolvedRole === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (resolvedRole === null) return <Navigate to="/choose-role" replace />;
  if (role && resolvedRole !== role) return <Navigate to="/" replace />;

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Auth required */}
        <Route
          path="/choose-role"
          element={
            <RequireAuth>
              <ChooseRole />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Role-protected */}
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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}