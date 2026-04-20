// src/pages/Signup.tsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

countries.registerLocale(enLocale);

export default function Signup() {
  const navigate    = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const countryList = useMemo(() => {
    const names = countries.getNames("en", { select: "official" });
    return Object.values(names).sort();
  }, []);

  const [isLoading, setIsLoading]           = useState(false);
  const [signupName, setSignupName]         = useState("");
  const [signupEmail, setSignupEmail]       = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRegion, setSignupRegion]     = useState("");
  const [remember, setRemember]             = useState(
    localStorage.getItem("auth_remember") === "1"
  );

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ── Email signup ──────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim())             return toast.error("Full name is required");
    if (!validateEmail(signupEmail))    return toast.error("Enter a valid email address");
    if (signupPassword.length < 6)      return toast.error("Password must be at least 6 characters");
    if (!signupRegion)                  return toast.error("Please select your region");

    try {
      setIsLoading(true);
      await signUp({
        fullName: signupName.trim(),
        email:    signupEmail.trim(),
        password: signupPassword,
        region:   signupRegion,
        remember,
      });
      toast.success("Account created — choose your role");
      // New email users always need to pick a role
      navigate("/choose-role", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google signup ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      const me = await signInWithGoogle(remember);
      // Existing Google user already has a role → go straight to dashboard
      // New Google user has no role → pick one
      if (me?.role === "entrepreneur")  navigate("/Dashboard",               { replace: true });
      else if (me?.role === "professional") navigate("/professional-dashboard", { replace: true });
      else if (me?.role === "admin")    navigate("/admin",                   { replace: true });
      else                              navigate("/choose-role",             { replace: true });
    } catch (e: any) {
      if (e?.code !== "auth/popup-closed-by-user") {
        toast.error(e.message || "Google sign-up failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg space-y-6">

        {/* Logo / heading */}
        <div className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign up to access teams and projects</p>
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
          <span className="text-xs text-muted-foreground">or sign up with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              disabled={isLoading}
              placeholder="Jane Doe"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              disabled={isLoading}
              placeholder="you@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Region</Label>
            <Select value={signupRegion} onValueChange={setSignupRegion} disabled={isLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {countryList.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
              id="remember_signup"
            />
            <Label htmlFor="remember_signup" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
