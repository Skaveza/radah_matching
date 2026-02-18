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
type RoleState = Role | undefined; // undefined = still checking

/**
 * RequireAuth
 * - Waits for auth initialization
 * - If not logged in, redirects to /login
 * - Saves "from" path so you can send the user back after login (optional)
 */
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

/**
 * RequireRole
 * - Prevents wrong redirects on refresh by using 3-state role resolution:
 *   undefined = still checking
 *   null      = confirmed missing
 *   "role"    = confirmed role
 *
 * - If role is missing, redirects to /choose-role
 * - If role doesn't match required role, redirects to /
 */
const RequireRole = ({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "entrepreneur" | "professional" | "admin";
}) => {
  const { user, loading, role: userRole, refreshMe } = useAuth();

  // Start as "checking" (undefined) instead of assuming missing (null)
  const [resolvedRole, setResolvedRole] = useState<RoleState>(undefined);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // Wait for auth init
      if (loading) return;

      // Not logged in
      if (!user) {
        if (mounted) setResolvedRole(null);
        return;
      }

      // Role already in context
      if (userRole) {
        if (mounted) setResolvedRole(userRole as Role);
        return;
      }

      // Role unknown -> fetch it (keep "checking" while fetching)
      if (mounted) setResolvedRole(undefined);

      try {
        const me = await refreshMe();
        if (mounted) setResolvedRole((me?.role ?? null) as Role);
      } catch {
        /**
         * IMPORTANT:
         * If backend call fails temporarily (network, cold start, etc),
         * do NOT treat it as "missing role" and redirect away.
         * Keep it in "checking" state to avoid bouncing to /choose-role.
         */
        if (mounted) setResolvedRole(undefined);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [user, loading, userRole, refreshMe]);

  // Still resolving auth or role -> show loader and do NOT redirect yet
  if (loading || resolvedRole === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Logged in, but confirmed missing role
  if (resolvedRole === null) return <Navigate to="/choose-role" replace />;

  // Enforce required role
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
