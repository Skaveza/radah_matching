import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, User, Briefcase, MapPin, Shield, Loader2, Check } from "lucide-react";
import Header from "@/components/landing/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  title: string;
  responsibility: string;
  whyCritical: string;
  experience: string;
  industry: string;
  skillFocus?: string;
}

interface Team {
  name: string;
  goal: string;
  roles: Role[];
}

type Tier = "blueprint" | "pro" | "membership";

const TIERS: { id: Tier; name: string; price: string; priceNote: string; features: string[] }[] = [
  {
    id: "blueprint",
    name: "Team Blueprint",
    price: "$199",
    priceNote: "one-time",
    features: ["Full contact details", "Salary benchmarking", "Team architecture export"],
  },
  {
    id: "pro",
    name: "Blueprint Pro",
    price: "$399",
    priceNote: "one-time",
    features: ["Everything in Blueprint", "Concierge introductions", "Priority support", "30-day replacement guarantee"],
  },
  {
    id: "membership",
    name: "Team Architect",
    price: "$149",
    priceNote: "/month",
    features: ["Unlimited architectures", "Recurring consultations", "Priority matching", "Dedicated account manager"],
  },
];

const TeamPreview = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>("blueprint");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedTeam = localStorage.getItem("selectedTeam");
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam) as Team);
    } else {
      navigate("/intake");
    }
  }, [navigate]);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { teamData: team, tier: selectedTier },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!team) return null;

  const currentTier = TIERS.find((t) => t.id === selectedTier)!;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                {team.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                {team.goal}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Full contact details unlocked after purchase
                </span>
              </div>
            </div>

            {/* Professionals Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {team.roles.map((role, index) => {
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tier Selection */}
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

            {/* Purchase Card */}
            <div className="bg-gradient-premium rounded-3xl p-8 md:p-10 text-primary-foreground animate-fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Unlock Your Team
                </h2>
                <p className="text-primary-foreground/70 mb-6">
                  Get instant access to full contact details for all {team.roles.length} professionals
                  with the {currentTier.name} plan.
                </p>

                <div className="flex items-baseline justify-center gap-2 mb-6">
                  <span className="text-4xl md:text-5xl font-display font-bold">
                    {currentTier.price}
                  </span>
                  <span className="text-primary-foreground/70">{currentTier.priceNote}</span>
                </div>

                <Button
                  variant="premium"
                  size="xl"
                  className="mb-6"
                  onClick={handlePurchase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5 mr-2" />
                  )}
                  {isLoading ? "Processing..." : `Unlock with ${currentTier.name}`}
                </Button>

                <div className="flex items-start gap-2 justify-center text-sm text-primary-foreground/60">
                  <Shield className="w-4 h-4 mt-0.5" />
                  <p className="text-left max-w-md">
                    You are purchasing AI-generated team architecture and vetted access —
                    not labor, employment, or managed services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamPreview;
