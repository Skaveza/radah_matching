import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Loader2, User2, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type MeResponse = {
  success: boolean;
  uid: string;
  role: "entrepreneur" | "professional" | "admin" | null;
  name: string | null;
  email: string | null;
  payment_status?: string | null;
  plan?: string | null;
  professional_status?: string | null;
};

export default function Profile() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

      const token = await auth.currentUser?.getIdToken().catch(() => null);
      if (!token) {
        toast.error("Please sign in again.");
        setMe(null);
        return;
      }

      const res = await apiFetch<MeResponse>("/api/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res?.success) throw new Error("Failed to load profile");
      setMe(res);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">View your account details and access status.</p>
            </div>

            {/* premium header card */}
            <div className="bg-gradient-premium rounded-3xl p-8 md:p-10 text-primary-foreground shadow-premium mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <User2 className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="font-display text-2xl font-bold">
                    {me?.name || me?.email || "Your Account"}
                  </div>
                  <div className="text-primary-foreground/70 mt-1">{me?.email || "—"}</div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Pill icon={<ShieldCheck className="w-3.5 h-3.5" />} label={`Role: ${me?.role || "—"}`} />
                    <Pill icon={<CreditCard className="w-3.5 h-3.5" />} label={`Plan: ${me?.plan || "—"}`} />
                    <Pill label={`Payment: ${me?.payment_status || "—"}`} />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={load}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* details */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-semibold text-foreground mb-6">Account Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow label="Name" value={me?.name || "—"} />
                <InfoRow label="Email" value={me?.email || "—"} />
                <InfoRow label="UID" value={me?.uid || "—"} mono />
                <InfoRow label="Professional Status" value={me?.professional_status || "—"} />
              </div>

              <div className="mt-8 flex gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>
                  Back
                </Button>
                <Button variant="premium" onClick={load}>
                  Reload Profile
                </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function Pill({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-primary-foreground/10 border border-primary-foreground/15">
      {icon}
      {label}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-sm font-medium text-foreground break-all", mono && "font-mono")}>
        {value}
      </div>
    </div>
  );
}
