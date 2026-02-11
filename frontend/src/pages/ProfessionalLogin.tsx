import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getUserRole } from "@/hooks/useRoleRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const ProfessionalLogin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if already logged in based on role
  useEffect(() => {
    const redirectBasedOnRole = async () => {
      if (!authLoading && user) {
        setIsRedirecting(true);
        const role = await getUserRole(user.id, user.email || "");
        
        switch (role) {
          case "admin":
            navigate("/admin");
            break;
          case "professional":
            navigate("/professional-dashboard");
            break;
          default:
            navigate("/dashboard");
        }
      }
    };
    
    redirectBasedOnRole();
  }, [user, authLoading, navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(loginEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(loginPassword)) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setIsLoading(false);
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back!");
      // Role-based redirect will happen via useEffect
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!validateEmail(signupEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(signupPassword)) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created! You can now access your dashboard.");
      // Role-based redirect will happen via useEffect
    }
  };

  if (authLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Professional Portal</CardTitle>
            <CardDescription>
              Sign in to manage your profile, view matches, and track applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link 
                        to="/reset-password?return=professional" 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Want to become a Radah professional?
              </p>
              <Button variant="link" asChild className="text-primary">
                <Link to="/apply">Apply Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfessionalLogin;
