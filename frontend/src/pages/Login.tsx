import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, role, signIn, signInWithGoogle, refreshMe } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(localStorage.getItem("auth_remember") === "1");

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // if user exists but role not loaded yet, try refresh once
    (async () => {
      try {
        if (!role) {
          const me = await refreshMe();
          const finalRole = me?.role ?? role;

          if (!finalRole) {
            navigate("/choose-role");
            return;
          }

          if (finalRole === "admin") navigate("/admin");
          else if (finalRole === "professional") navigate("/professional-dashboard");
          else navigate("/dashboard");
          return;
        }

        if (role === "admin") navigate("/admin");
        else if (role === "professional") navigate("/professional-dashboard");
        else navigate("/dashboard");
      } catch {
        // If backend is down, don’t force choose-role; show message instead
      }
    })();
  }, [user, loading, role, navigate, refreshMe]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) return toast.error("Enter a valid email address");
    if (loginPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      setIsLoading(true);
      await signIn(loginEmail.trim(), loginPassword, remember);
      toast.success("Welcome back");
      // redirect handled in effect
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      const me = await signInWithGoogle(remember);

      // if new google user => role null => choose role
      if (!me?.role) {
        navigate("/choose-role");
        return;
      }

      if (me.role === "admin") navigate("/admin");
      else if (me.role === "professional") navigate("/professional-dashboard");
      else navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg">
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 mb-6 relative z-10">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup" onClick={() => navigate("/choose-role")}>
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading} />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} id="remember" />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>

                <Link to="/reset-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sign In
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue with Google
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
