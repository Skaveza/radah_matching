import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

countries.registerLocale(enLocale);

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signInWithGoogle } = useAuth();

  const countryList = useMemo(() => {
    const names = countries.getNames("en", { select: "official" });
    return Object.values(names).sort();
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(loginEmail)) return toast.error("Enter a valid email address");
    if (!validatePassword(loginPassword)) return toast.error("Password must be at least 6 characters");

    try {
      setIsLoading(true);
      await signIn(loginEmail, loginPassword);
      toast.success("Welcome back");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success("Signed in with Google");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg">
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup" disabled>Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading} />
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading} />
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <Link to="/reset-password" className="text-primary hover:underline">Forgot password?</Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={isLoading}>
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
