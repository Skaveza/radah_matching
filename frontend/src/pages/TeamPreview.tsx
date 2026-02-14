// src/pages/TeamPreview.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, User, Briefcase, MapPin, Shield, Loader2, Check } from "lucide-react";
import Header from "@/components/landing/Header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

interface Role {
  id: string;
  title: string;
  responsibility: string;
  whyCritical: string;
  experience: string;
  industry: string;
  skillFocus?: string;
}

type Tier = "blueprint" | "pro" | "membership";

const TIERS: { id: Tier; name: string; price: string; priceNote: string; features: string[] }[] = [
  { id: "blueprint", name: "Team Blueprint", price: "$199", priceNote: "one-time", features: ["Full contact details", "Salary benchmarking", "Team architecture export"] },
  { id: "pro", name: "Blueprint Pro", price: "$399", priceNote: "one-time", features: ["Everything in Blueprint", "Concierge introductions", "Priority support", "30-day replacement guarantee"] },
  { id: "membership", name: "Team Architect", price: "$149", priceNote: "/month", features: ["Unlimited architectures", "Recurring consultations", "Priority matching", "Dedicated account manager"] },
];

export default function TeamPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ projectId?: string }>();

  const projectId =
    searchParams.get("projectId") ||
    params.projectId ||
    localStorage.getItem("activeProjectId") ||
    "";

  const [roles, setRoles] = useState<Role[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>("blueprint");
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  const currentTier = useMemo(() => TIERS.find((t) => t.id === selectedTier)!, [selectedTier]);

  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        toast.error("Missing project id. Please restart from Intake.");
        navigate("/intake");
        return;
      }

      try {
        setLoading(true);

        // keep in storage
        localStorage.setItem("activeProjectId", projectId);

        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Missing auth token");

        const res = await apiFetch<{
          success: boolean;
          project_id: string;
          team: any[];
          unlocked: boolean;
        }>(`/api/projects/${encodeURIComponent(projectId)}/recommendation`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        setUnlocked(!!res.unlocked);
        const team = Array.isArray(res.team) ? res.team : [];

        // Your backend team entries might be:
        // - { professional: {...}, score, debug } OR
        // - already flattened roles
        // We normalize to Role[] for UI:
        const normalized: Role[] = team.map((m: any, idx: number) => {
          const p = m?.professional ?? m;
          const debug = m?.debug ?? {};
          const overlaps: string[] = Array.isArray(debug.cap_overlap) ? debug.cap_overlap : [];

          const skills =
            typeof p?.skillFocus === "string"
              ? p.skillFocus.split(",").map((s: string) => s.trim()).filter(Boolean)
              : Array.isArray(p?.skills)
                ? p.skills
                : Array.isArray(p?.core_skills)
                  ? p.core_skills
                  : overlaps;

          return {
            id: p?.id || p?.uid || `${idx}`,
            title: p?.primary_role || p?.title || "Recommended Specialist",
            responsibility:
              p?.professional_summary
                ? String(p.professional_summary).slice(0, 220)
                : overlaps.length
                  ? `Lead delivery around: ${overlaps.join(", ")}.`
                  : "Lead delivery and execution for this project role.",
            whyCritical:
              overlaps.length
                ? `Strong match on: ${overlaps.slice(0, 4).join(", ")}.`
                : "Selected as a strong overall match.",
            experience: p?.years_experience || "—",
            industry:
              Array.isArray(p?.industry_experience) && p.industry_experience.length
                ? p.industry_experience[0]
                : p?.region || "—",
            skillFocus: (skills || []).slice(0, 10).join(", "),
          };
        });

        setRoles(normalized);
      } catch (e: any) {
        toast.error(e.message || "Failed to load team preview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, navigate]);

  const handleCheckout = async () => {
    if (!projectId) return;

    try {
      setPayLoading(true);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Missing auth token");

      const res = await apiFetch<{ success: boolean; url: string }>(`/api/payments/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          plan: selectedTier,
        }),
      });

      if (!res.url) throw new Error("No Stripe URL returned");

      window.location.href = res.url;
    } catch (e: any) {
      toast.error(e.message || "Failed to start checkout");
    } finally {
      setPayLoading(false);
    }
  };

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
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Team Preview
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                {unlocked
                  ? "You have unlocked full profiles and contact details."
                  : "Profiles are masked until payment is completed."}
              </p>
              {!unlocked && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Full contact details unlocked after purchase
                  </span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {roles.map((role, index) => {
                const skills = role.skillFocus?.split(",").map((s) => s.trim()).filter(Boolean) || [];
                return (
                  <div
                    key={role.id || index}
                    className="bg-card rounded-2xl border border-border p-6 animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{role.title}</h3>

                        <div className="space-y-2 mt-3">
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-0.5 text-xs rounded-md bg-accent/10 text-accent-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{role.experience}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{role.industry}</span>
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-muted-foreground">
                          {role.whyCritical}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!unlocked && (
              <>
                <div className="mb-8 animate-fade-up">
                  <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">
                    Choose Your Plan
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={cn(
                          "relative rounded-2xl border-2 p-6 text-left transition-all",
                          selectedTier === tier.id
                            ? "border-accent bg-accent/5 shadow-lg"
                            : "border-border hover:border-accent/30"
                        )}
                      >
                        {tier.id === "pro" && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                            Most Popular
                          </span>
                        )}
                        <h3 className="font-semibold text-foreground mb-1">{tier.name}</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-2xl font-display font-bold text-foreground">{tier.price}</span>
                          <span className="text-sm text-muted-foreground">{tier.priceNote}</span>
                        </div>
                        <ul className="space-y-2">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-accent flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-premium rounded-3xl p-8 md:p-10 text-primary-foreground animate-fade-up">
                  <div className="max-w-2xl mx-auto text-center">
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Unlock Your Team</h2>
                    <p className="text-primary-foreground/70 mb-6">
                      Get access to full profiles for all {roles.length} professionals with the {currentTier.name} plan.
                    </p>

                    <div className="flex items-baseline justify-center gap-2 mb-6">
                      <span className="text-4xl md:text-5xl font-display font-bold">{currentTier.price}</span>
                      <span className="text-primary-foreground/70">{currentTier.priceNote}</span>
                    </div>

                    <Button
                      variant="premium"
                      size="xl"
                      className="mb-6"
                      onClick={handleCheckout}
                      disabled={payLoading}
                    >
                      {payLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                      {payLoading ? "Redirecting..." : `Checkout (${currentTier.name})`}
                    </Button>

                    <div className="flex items-start gap-2 justify-center text-sm text-primary-foreground/60">
                      <Shield className="w-4 h-4 mt-0.5" />
                      <p className="text-left max-w-md">
                        You are purchasing AI-generated matching access — not labor, employment, or managed services.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
