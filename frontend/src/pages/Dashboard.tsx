import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Users, Unlock, ArrowRight, Loader2, LogOut, Mail, Linkedin, Phone, ExternalLink } from "lucide-react";
import Header from "@/components/landing/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Professional {
  roleTitle: string;
  name: string;
  email: string;
  linkedin: string;
  phone?: string | null;
  portfolio?: string | null;
}

interface PurchasedTeam {
  id: string;
  team_name: string;
  team_data: any;
  professionals: Professional[];
  created_at: string;
  customer_email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [teams, setTeams] = useState<PurchasedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("purchased_teams")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Parse professionals JSON
        const parsedTeams = (data || []).map(team => ({
          ...team,
          professionals: Array.isArray(team.professionals) 
            ? team.professionals 
            : JSON.parse(team.professionals as string)
        }));
        
        setTeams(parsedTeams);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Failed to load your teams");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTeams();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (authLoading || (!user && authLoading)) {
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
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Your Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
                <Button variant="premium" asChild>
                  <Link to="/intake" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                  </Link>
                </Button>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : teams.length > 0 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-8">
                  <TabsTrigger value="all">All Teams ({teams.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {teams.map((team) => (
                    <TeamCard 
                      key={team.id} 
                      team={team} 
                      isExpanded={expandedTeam === team.id}
                      onToggle={() => setExpandedTeam(
                        expandedTeam === team.id ? null : team.id
                      )}
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
};

const TeamCard = ({ 
  team, 
  isExpanded, 
  onToggle 
}: { 
  team: PurchasedTeam; 
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const roleCount = team.professionals?.length || 0;
  
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-accent/30">
      <div 
        className="p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-foreground">{team.team_name}</h3>
                <span className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1 bg-success/20 text-success">
                  <Unlock className="w-3 h-3" />
                  Purchased
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{roleCount} professional{roleCount !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>Purchased {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="gap-2">
            {isExpanded ? "Hide Details" : "View Team"}
            <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-border/50">
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {team.professionals?.map((pro, index) => (
              <div
                key={index}
                className="bg-muted/50 rounded-xl p-4"
              >
                <div className="mb-3">
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                    {pro.roleTitle}
                  </span>
                </div>
                
                <h4 className="font-semibold text-foreground mb-3">
                  {pro.name}
                </h4>
                
                <div className="space-y-2">
                  <a 
                    href={`mailto:${pro.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {pro.email}
                  </a>
                  
                  <a 
                    href={pro.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  
                  {pro.phone && (
                    <a 
                      href={`tel:${pro.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {pro.phone}
                    </a>
                  )}
                  
                  {pro.portfolio && (
                    <a 
                      href={pro.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border">
      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-foreground mb-2">No purchased teams yet</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Design your first team to get matched with vetted professionals.
      </p>
      <Button variant="premium" asChild>
        <Link to="/intake">Design Your Team</Link>
      </Button>
    </div>
  );
};

export default Dashboard;
