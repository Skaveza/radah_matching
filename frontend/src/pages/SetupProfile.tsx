import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function SetupProfile() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, usersSetup, role: currentRole, loading } = useAuth();

  const countryList = useMemo(() => {
    const names = countries.getNames("en", { select: "official" });
    return Object.values(names).sort();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"entrepreneur" | "professional">("entrepreneur");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    const r = params.get("role");
    if (r === "professional" || r === "entrepreneur") setRole(r);
  }, [params]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    // if already has role/profile, go dashboard
    if (!loading && user && currentRole) {
      if (currentRole === "admin") navigate("/admin");
      else if (currentRole === "professional") navigate("/professional-dashboard");
      else navigate("/dashboard");
    }
  }, [loading, user, currentRole, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Full name is required");
    if (!region) return toast.error("Please select your region");

    try {
      setIsLoading(true);
      await usersSetup({ name: name.trim(), role, region });
      toast.success("Profile setup complete");

      if (role === "professional") navigate("/professional-dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Failed to setup profile");
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-lg">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 className="text-2xl font-semibold">Finish setting up your profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We need role + region to personalize your dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Role</Label>
            <div className="flex space-x-3 mt-2">
              <Button type="button" variant={role === "entrepreneur" ? "default" : "outline"} onClick={() => setRole("entrepreneur")} disabled={isLoading} className="flex-1">
                Entrepreneur
              </Button>
              <Button type="button" variant={role === "professional" ? "default" : "outline"} onClick={() => setRole("professional")} disabled={isLoading} className="flex-1">
                Professional
              </Button>
            </div>
          </div>

          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} placeholder={user?.displayName || "Your name"} />
          </div>

          <div>
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {countryList.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
}
