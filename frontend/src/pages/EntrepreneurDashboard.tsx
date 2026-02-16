// src/pages/EntrepreneurDashboard.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, FileText, Users, ArrowRight, Unlock, Lock, Eye } from "lucide-react";
import Header from "@/components/landing/Header";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

type ProjectRow = {
  project_id: string;
  project: any;
  team: any | null; // from /api/projects
};

export default function EntrepreneurDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Missing auth token");

        const res = await apiFetch<{ success: boolean; projects: ProjectRow[] }>("/api/projects", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        setProjects(res.projects || []);
      } catch (e: any) {
        toast.error(e.message || "Failed to load your projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchProjects();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {user?.displayName || user?.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>

                <Button variant="premium" asChild>
                  <Link to="/intake" className="gap-2">
                    <Users className="w-4 h-4" />
                    New Project
                  </Link>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : projects.length > 0 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-8">
                  <TabsTrigger value="all">All Projects ({projects.length})</TabsTrigger>
                  <TabsTrigger value="ready">
                    Team Ready ({projects.filter((p) => !!p.team).length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Team Missing ({projects.filter((p) => !p.team).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.project_id}
                      row={p}
                      isExpanded={expanded === p.project_id}
                      onToggle={() => setExpanded(expanded === p.project_id ? null : p.project_id)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="ready" className="space-y-4">
                  {projects.filter((p) => !!p.team).map((p) => (
                    <ProjectCard
                      key={p.project_id}
                      row={p}
                      isExpanded={expanded === p.project_id}
                      onToggle={() => setExpanded(expanded === p.project_id ? null : p.project_id)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {projects.filter((p) => !p.team).map((p) => (
                    <ProjectCard
                      key={p.project_id}
                      row={p}
                      isExpanded={expanded === p.project_id}
                      onToggle={() => setExpanded(expanded === p.project_id ? null : p.project_id)}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({
  row,
  isExpanded,
  onToggle,
}: {
  row: ProjectRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const project = row.project || {};
  const hasTeam = !!row.team;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-accent/30">
      <div className="p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-foreground">{project.industry || "Untitled Project"}</h3>

                {hasTeam ? (
                  <span className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1 bg-success/20 text-success">
                    <Unlock className="w-3 h-3" />
                    Team Ready
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1 bg-muted text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    Team Missing
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>Stage: {project.project_stage || "-"}</span>
                <span>•</span>
                <span>Budget: {project.budget_range || "-"}</span>
                <span>•</span>
                <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}</span>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="gap-2">
            {isExpanded ? "Hide" : "View"}
            <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-border/50">
          <div className="mt-4 space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Description: </span>
              <span className="text-foreground">{project.description || "-"}</span>
            </div>

            {hasTeam ? (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="gap-2" onClick={() => navigate(`/team-preview/${row.project_id}`)}>
                  <Eye className="w-4 h-4" />
                  View Team
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button variant="premium" onClick={() => navigate(`/team-builder/${row.project_id}`)}>
                  Generate Team
                </Button>
                <Button asChild variant="outline">
                  <Link to="/intake">Edit Project</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border">
      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-foreground mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground mb-6">Create your first project to generate a team blueprint.</p>
      <Button variant="premium" asChild>
        <Link to="/intake">Create Project</Link>
      </Button>
    </div>
  );
}
