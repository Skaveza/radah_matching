// src/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Layout
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ChooseRole from "@/pages/ChooseRole";
import Profile from "@/pages/Profile";
import EntrepreneurDashboard from "@/pages/EntrepreneurDashboard";
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
import TeamPerformance from "@/pages/TeamPerformance";
import MyProjects from "@/pages/MyProjects";
import ProjectExecution from "@/pages/ProjectExecution";
import TeamArchitecture from "@/pages/TeamArchitecture";
import CandidatePipeline from "@/pages/CandidatePipeline";
import InvestorReadiness from "@/pages/InvestorReadiness";
import BudgetRunway from "@/pages/BudgetRunway";

type Role = "entrepreneur" | "professional" | "admin" | null;
type RoleState = Role | undefined;

// ── AUTH GUARD ─────────────────────────────────────────────
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

// ── ROLE GUARD ─────────────────────────────────────────────
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
      if (loading) return;
      if (!user) { if (mounted) setResolvedRole(null); return; }
      if (userRole) { if (mounted) setResolvedRole(userRole as Role); return; }
      try {
        const me = await refreshMe();
        if (mounted) setResolvedRole((me?.role ?? null) as Role);
      } catch (e) {
        console.error("[RequireRole] refreshMe error:", e);
        if (mounted) setResolvedRole(null);
      }
    };
    run();
    return () => { mounted = false; };
  }, [user, loading, userRole, refreshMe]);

  if (loading || resolvedRole === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (resolvedRole === null) return <Navigate to="/choose-role" replace />;
  if (role && resolvedRole !== role) return <Navigate to="/" replace />;

  return children;
};

// ── ENTREPRENEUR LAYOUT GUARD ──────────────────────────────
// Combines role check + DashboardLayout in one wrapper
const EntrepreneurPage = ({ children }: { children: JSX.Element }) => (
  <RequireRole role="entrepreneur">
    <DashboardLayout>
      {children}
    </DashboardLayout>
  </RequireRole>
);

// ── ROUTES ─────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC ───────────────── */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* ── AUTH (no layout) ─────── */}
        <Route path="/choose-role" element={<RequireAuth><ChooseRole /></RequireAuth>} />
        <Route path="/profile"     element={<RequireAuth><Profile /></RequireAuth>} />

        {/* ── PROFESSIONAL ─────────── */}
        <Route
          path="/professional/apply"
          element={<RequireRole role="professional"><ProfessionalApplication /></RequireRole>}
        />
        <Route
          path="/professional/dashboard"
          element={<RequireRole role="professional"><ProfessionalDashboard /></RequireRole>}
        />

        {/* ── ENTREPRENEUR (all wrapped in DashboardLayout) ── */}
        <Route path="/dashboard"              element={<EntrepreneurPage><EntrepreneurDashboard /></EntrepreneurPage>} />
        <Route path="/intake"                 element={<EntrepreneurPage><Intake /></EntrepreneurPage>} />
        <Route path="/team-builder"           element={<EntrepreneurPage><TeamBuilder /></EntrepreneurPage>} />
        <Route path="/team-builder/:projectId" element={<EntrepreneurPage><TeamBuilder /></EntrepreneurPage>} />
        <Route path="/team-preview"           element={<EntrepreneurPage><TeamPreview /></EntrepreneurPage>} />
        <Route path="/team-preview/:projectId" element={<EntrepreneurPage><TeamPreview /></EntrepreneurPage>} />
        <Route path="/projects"               element={<EntrepreneurPage><MyProjects /></EntrepreneurPage>} />
        <Route path="/execution"              element={<EntrepreneurPage><ProjectExecution /></EntrepreneurPage>} />
        <Route path="/team"                   element={<EntrepreneurPage><TeamArchitecture /></EntrepreneurPage>} />
        <Route path="/pipeline"               element={<EntrepreneurPage><CandidatePipeline /></EntrepreneurPage>} />
        <Route path="/performance"            element={<EntrepreneurPage><TeamPerformance /></EntrepreneurPage>} />
        <Route path="/investors"              element={<EntrepreneurPage><InvestorReadiness /></EntrepreneurPage>} />
        <Route path="/runway"                 element={<EntrepreneurPage><BudgetRunway /></EntrepreneurPage>} />

        {/* ── ADMIN ────────────────── */}
        <Route path="/admin" element={<RequireRole role="admin"><Admin /></RequireRole>} />

        {/* ── 404 ──────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}