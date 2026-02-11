import { useState, useMemo } from "react";
import { useRouter } from "next/router";
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

const Signup = () => {
  const router = useRouter();
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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName.trim()) return toast.error("Full name is required");
    if (!validateEmail(signupEmail)) return toast.error("Enter a valid email address");
    if (!validatePassword(signupPassword)) return toast.error("Password must be at least 6 characters");
    if (!signupRegion) return toast.error("Please select your region");

    try {
      setIsLoading(true);

      await signUp({
        fullName: signupName,
        email: signupEmail,
        password: signupPassword,
        role,
        region: signupRegion,
      });

      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label>Role</Label>
            <div className="flex space-x-4">
              <Button type="button" variant={role === "entrepreneur" ? "default" : "outline"} onClick={() => setRole("entrepreneur")}>Entrepreneur</Button>
              <Button type="button" variant={role === "professional" ? "default" : "outline"} onClick={() => setRole("professional")}>Professional</Button>
            </div>
          </div>

          <div>
            <Label>Full Name</Label>
            <Input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} disabled={isLoading} />
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
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
