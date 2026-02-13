import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

countries.registerLocale(enLocale);

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { signUp } = useAuth();

  const countryList = useMemo(() => {
    const names = countries.getNames("en", { select: "official" });
    return Object.values(names).sort();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"entrepreneur" | "professional">("entrepreneur");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRegion, setSignupRegion] = useState("");

  useEffect(() => {
    const r = params.get("role");
    if (r === "professional" || r === "entrepreneur") setRole(r);
  }, [params]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName.trim()) return toast.error("Full name is required");
    if (!validateEmail(signupEmail)) return toast.error("Enter a valid email address");
    if (signupPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (!signupRegion) return toast.error("Please select your region");

    try {
      setIsLoading(true);

      await signUp({
        fullName: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role,
        region: signupRegion,
      });

      toast.success("Account created successfully");

      // ✅ FIX: redirect to real routes
      if (role === "professional") navigate("/professional-dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign up to access teams and projects
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label>Role</Label>
            <div className="flex space-x-3 mt-2">
              <Button
                type="button"
                variant={role === "entrepreneur" ? "default" : "outline"}
                onClick={() => setRole("entrepreneur")}
                disabled={isLoading}
                className="flex-1"
              >
                Entrepreneur
              </Button>
              <Button
                type="button"
                variant={role === "professional" ? "default" : "outline"}
                onClick={() => setRole("professional")}
                disabled={isLoading}
                className="flex-1"
              >
                Professional
              </Button>
            </div>
          </div>

          <div>
            <Label>Full Name</Label>
            <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} disabled={isLoading} />
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} disabled={isLoading} />
          </div>

          <div>
            <Label>Password</Label>
            <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} disabled={isLoading} />
          </div>

          <div>
            <Label>Region</Label>
            <Select value={signupRegion} onValueChange={setSignupRegion} disabled={isLoading}>
              <SelectTrigger>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Account
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
