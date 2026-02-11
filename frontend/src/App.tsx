import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Intake from "./pages/Intake";
import TeamBuilder from "./pages/TeamBuilder";
import TeamPreview from "./pages/TeamPreview";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProfessionalApplication from "./pages/ProfessionalApplication";
import ProfessionalLogin from "./pages/ProfessionalLogin";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/team-builder" element={<TeamBuilder />} />
            <Route path="/team-preview" element={<TeamPreview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/professionals" element={<ProfessionalApplication />} />
            <Route path="/professional-login" element={<ProfessionalLogin />} />
            <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
