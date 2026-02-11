import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import RoleCard from "@/components/team/RoleCard";
import AddRoleDialog from "@/components/team/AddRoleDialog";
import AISuggestions from "@/components/team/AISuggestions";
import TeamBuilderSkeleton from "@/components/team/TeamBuilderSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface SecondaryTeam extends Team {
  whyThisComesLater?: string;
}

const TeamBuilder = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [secondaryTeam, setSecondaryTeam] = useState<SecondaryTeam | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ type: "warning" | "success" | "info"; message: string }>>([]);

  useEffect(() => {
    const generateTeam = async () => {
      const intakeDataStr = localStorage.getItem("intakeData");
      if (!intakeDataStr) {
        setError("No project data found. Please complete the intake form first.");
        setIsLoading(false);
        return;
      }

      try {
        const intakeData = JSON.parse(intakeDataStr);
        
        const { data, error: fnError } = await supabase.functions.invoke("generate-team", {
          body: { intakeData },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setTeam(data.primaryTeam);
        setSecondaryTeam(data.secondaryTeam);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Team generation error:", err);
        setError(err instanceof Error ? err.message : "Failed to generate team. Please try again.");
        toast.error("Failed to generate team recommendation");
      } finally {
        setIsLoading(false);
      }
    };

    generateTeam();
  }, []);

  const handleRemoveRole = (roleId: string) => {
    if (!team) return;

    const removedRole = team.roles.find((r) => r.id === roleId);
    setTeam({
      ...team,
      roles: team.roles.filter((r) => r.id !== roleId),
    });

    if (removedRole) {
      setSuggestions([
        {
          type: "warning",
          message: `Removing ${removedRole.title} may impact your team's ability to execute effectively.`,
        },
        {
          type: "info",
          message: "Other team members may need to absorb these responsibilities.",
        },
      ]);
    }
  };

  const handleAddRole = (role: Role) => {
    if (!team) return;

    setTeam({
      ...team,
      roles: [...team.roles, role],
    });

    setSuggestions([
      {
        type: "success",
        message: `Added ${role.title}. This enhances your team's capabilities.`,
      },
    ]);
  };

  const handleProceed = () => {
    if (team) {
      localStorage.setItem("selectedTeam", JSON.stringify(team));
      navigate("/team-preview");
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    window.location.reload();
  };

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
              <p className="text-muted-foreground">
                Our AI is building the optimal team for your project...
              </p>
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
            {/* Team Header */}
            <div className="text-center mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <span className="text-sm font-medium text-accent-foreground">
                  Recommended Team
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                {team?.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                {team?.goal}
              </p>
              {team?.whyThisTeam && (
                <p className="text-sm text-foreground/80 max-w-2xl mx-auto bg-accent/5 rounded-xl p-4 border border-accent/10">
                  {team.whyThisTeam}
                </p>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Roles */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">
                    Team Roles ({team?.roles.length})
                  </h2>
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
                      <RoleCard
                        role={role}
                        onRemove={() => handleRemoveRole(role.id)}
                      />
                    </div>
                  ))}
                </div>

                {/* Secondary Team Preview */}
                {secondaryTeam && (
                  <div className="mt-12 pt-8 border-t border-border">
                    <div className="mb-6">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Next Phase
                      </span>
                      <h3 className="font-display text-xl font-semibold text-foreground mt-1">
                        {secondaryTeam.name}
                      </h3>
                      {secondaryTeam.whyThisComesLater && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {secondaryTeam.whyThisComesLater}
                        </p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 opacity-60">
                      {secondaryTeam.roles.slice(0, 4).map((role) => (
                        <div
                          key={role.id}
                          className="bg-muted/30 rounded-lg p-3 text-sm"
                        >
                          <span className="font-medium text-foreground">{role.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <AISuggestions suggestions={suggestions} />

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Ready to proceed?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Preview your team with anonymized professional details before purchase.
                  </p>
                  <Button
                    variant="premium"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleProceed}
                    disabled={!team || team.roles.length === 0}
                  >
                    Preview Team
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Customization Note */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Customization:</strong> You may remove one role or add one role from the same domain before purchase.
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

export default TeamBuilder;
