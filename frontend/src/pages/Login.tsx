import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, role, signIn, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (!role) {
      navigate("/choose-role");
      return;
    }

    if (role === "professional") navigate("/professional-dashboard");
    else if (role === "admin") navigate("/admin");
    else navigate("/dashboard");
  }, [user, loading, role, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) return toast.error("Enter a valid email address");
    if (loginPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      setIsLoading(true);
      await signIn(loginEmail.trim(), loginPassword);
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
      const me = await signInWithGoogle();

      if (!me?.role) {
        navigate("/choose-role");
        return;
      }

      if (me.role === "professional") navigate("/professional-dashboard");
      else if (me.role === "admin") navigate("/admin");
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
                <Input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end text-sm">
                <Link to="/reset-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sign In
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={isLoading}
              >
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
