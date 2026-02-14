// src/pages/Recommendation.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import RoleCard from "@/components/team/RoleCard";
import AddRoleDialog from "@/components/team/AddRoleDialog";
import AISuggestions from "@/components/team/AISuggestions";
import TeamBuilderSkeleton from "@/components/team/TeamBuilderSkeleton";
import { toast } from "sonner";
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

interface Team {
  name: string;
  goal: string;
  whyThisTeam?: string;
  templateId?: string;
  roles: Role[];
}

type Suggestion = { type: "warning" | "success" | "info"; message: string };

type BackendMember = {
  professional: any;
  score: number;
  debug?: any;
};

function expLabel(years: string | undefined) {
  switch (years) {
    case "10_plus":
      return "10+ years";
    case "7_10":
      return "7–10 years";
    case "5_7":
      return "5–7 years";
    case "3_5":
      return "3–5 years";
    case "1_3":
      return "1–3 years";
    default:
      return years ? String(years) : "—";
  }
}

function mapMemberToRole(m: BackendMember, idx: number): Role {
  const p = m.professional || {};
  const d = m.debug || {};
  const overlaps: string[] = Array.isArray(d.cap_overlap) ? d.cap_overlap : [];

  const skills =
    Array.isArray(p.skills) ? p.skills :
    Array.isArray(p.core_skills) ? p.core_skills :
    overlaps;

  return {
    id: p.id || p.uid || `${idx}`,
    title: p.primary_role || p.title || "Recommended Specialist",
    responsibility:
      p.professional_summary
        ? String(p.professional_summary).slice(0, 220)
        : overlaps.length
          ? `Lead delivery around: ${overlaps.join(", ")}.`
          : "Lead delivery and execution for this project role.",
    whyCritical:
      overlaps.length
        ? `Strong match on: ${overlaps.slice(0, 4).join(", ")} (score: ${m.score}).`
        : `Selected as a strong overall match (score: ${m.score}).`,
    experience: expLabel(p.years_experience),
    industry:
      Array.isArray(p.industry_experience) && p.industry_experience.length
        ? p.industry_experience[0]
        : p.region || "—",
    skillFocus: (skills || []).slice(0, 8).join(", "),
  };
}

export default function Recommendation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ projectId?: string }>();

  // ✅ projectId comes from query OR param OR localStorage fallback
  const projectId =
    searchParams.get("projectId") ||
    params.projectId ||
    localStorage.getItem("activeProjectId") ||
    "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [team, setTeam] = useState<Team | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const teamRolesCount = useMemo(() => team?.roles.length ?? 0, [team]);

  useEffect(() => {
    const run = async () => {
      if (!projectId) {
        setError("Missing project id. Please restart from Intake.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // store for other pages
        localStorage.setItem("activeProjectId", projectId);

        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Missing auth token");

        const res = await apiFetch<{
          success: boolean;
          project_id: string;
          team: BackendMember[];
          project_signals?: any;
        }>(`/api/projects/${encodeURIComponent(projectId)}/team/generate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const members = Array.isArray(res.team) ? res.team : [];
        const roles = members.map((m, i) => mapMemberToRole(m, i));

        setTeam({
          name: "Your Recommended Team",
          goal: "A 4-role team generated from your project needs and available professionals.",
          whyThisTeam:
            "We prioritized capability overlap, industry alignment, experience, availability, and region where applicable.",
          roles,
        });

        if (roles.length < 4) {
          setSuggestions([
            { type: "warning", message: "Fewer than 4 matches were available under your constraints." },
          ]);
        } else {
          setSuggestions([{ type: "info", message: "You can remove or add a role, then proceed to preview." }]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to generate team. Please try again.");
        toast.error("Failed to generate team recommendation");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [projectId]);

  const handleRemoveRole = (roleId: string) => {
    if (!team) return;

    const removedRole = team.roles.find((r) => r.id === roleId);
    const nextRoles = team.roles.filter((r) => r.id !== roleId);

    setTeam({ ...team, roles: nextRoles });

    if (removedRole) {
      setSuggestions([
        { type: "warning", message: `Removing ${removedRole.title} may reduce execution capacity.` },
        { type: "info", message: "Other team members may need to absorb those responsibilities." },
      ]);
    }
  };

  const handleAddRole = (role: Role) => {
    if (!team) return;
    setTeam({ ...team, roles: [...team.roles, role] });
    setSuggestions([{ type: "success", message: `Added ${role.title}.` }]);
  };

  const handleProceed = async () => {
    if (!team || !projectId) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Missing auth token");

      await apiFetch(`/api/projects/${encodeURIComponent(projectId)}/team/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team: team.roles }),
      });

      localStorage.setItem("selectedTeam", JSON.stringify(team));

      // ✅ go to preview with query (also works with param route)
      navigate(`/team-preview?projectId=${encodeURIComponent(projectId)}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save team");
    }
  };

  const handleRetry = () => window.location.reload();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Designing Your Team Architecture
              </h1>
              <p className="text-muted-foreground">Our AI is building the optimal team for your project...</p>
            </div>
            <TeamBuilderSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-8">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/intake")}>
                  Back to Intake
                </Button>
                <Button variant="premium" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <span className="text-sm font-medium text-accent-foreground">Recommended Team</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                {team?.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">{team?.goal}</p>
              {team?.whyThisTeam && (
                <p className="text-sm text-foreground/80 max-w-2xl mx-auto bg-accent/5 rounded-xl p-4 border border-accent/10">
                  {team.whyThisTeam}
                </p>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">Team Roles ({teamRolesCount})</h2>
                  <AddRoleDialog
                    onAdd={handleAddRole}
                    existingRoleIds={team?.roles.map((r) => r.id) || []}
                    teamType={team?.templateId}
                  />
                </div>

                <div className="space-y-4">
                  {team?.roles.map((role, index) => (
                    <div
                      key={role.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <RoleCard role={role} onRemove={() => handleRemoveRole(role.id)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <AISuggestions suggestions={suggestions} />

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Ready to proceed?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Preview your team (masked details) before purchase.
                  </p>
                  <Button
                    variant="premium"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleProceed}
                    disabled={!team || team.roles.length === 0}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Customization:</strong> You can add or remove roles before checkout.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
