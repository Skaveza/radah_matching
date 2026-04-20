// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ── Single source of truth for role → path ────────────────────────────────────
export function roleToPath(role: string | null | undefined): string {
  if (role === "admin")        return "/admin";
  if (role === "professional") return "/professional-dashboard";
  if (role === "entrepreneur") return "/Dashboard";   // capital D
  return "/choose-role";                               // no role yet
}

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, role, signIn, signInWithGoogle, refreshMe } = useAuth();

  const [isLoading, setIsLoading]         = useState(false);
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember]           = useState(
    localStorage.getItem("auth_remember") === "1"
  );

  // ── Auto-redirect already-authenticated users ─────────────────────────────
  useEffect(() => {
    if (loading || !user) return;

    (async () => {
      try {
        const me        = role ? null : await refreshMe();
        const finalRole = role ?? me?.role ?? null;
        navigate(roleToPath(finalRole), { replace: true });
      } catch {
        // backend unreachable — stay on login
      }
    })();
  }, [user, loading, role, navigate, refreshMe]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // ── Email / password ──────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail))  return toast.error("Enter a valid email");
    if (loginPassword.length < 6)    return toast.error("Password must be at least 6 characters");

    try {
      setIsLoading(true);
      await signIn(loginEmail.trim(), loginPassword, remember);
      toast.success("Welcome back");
      // redirect handled by the useEffect above
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      const me = await signInWithGoogle(remember);
      navigate(roleToPath(me?.role), { replace: true });
    } catch (e: any) {
      if (e?.code !== "auth/popup-closed-by-user") {
        toast.error(e.message || "Google sign-in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg space-y-6">

        {/* Logo / heading */}
        <div className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Radah Works</p>
        </div>

        {/* Google button — prominent at top */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleGoogle}
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or sign in with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={isLoading}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Password</Label>
              <Link to="/reset-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
              id="remember"
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign In
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
