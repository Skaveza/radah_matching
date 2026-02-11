import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Role {
  id: string;
  title: string;
  responsibility: string;
  whyCritical: string;
  experience: string;
  industry: string;
  skillFocus?: string;
}

// Contextual role suggestions per team type
const ROLE_SUGGESTIONS: Record<string, Omit<Role, "id">[]> = {
  mvp_build: [
    { title: "Mobile Developer", responsibility: "Build native or cross-platform mobile apps", whyCritical: "Mobile reach for your MVP", experience: "3-5 years", industry: "Tech", skillFocus: "React Native, iOS, Android" },
    { title: "Data Engineer", responsibility: "Design data pipelines and storage", whyCritical: "Scalable data foundation", experience: "4-6 years", industry: "Tech", skillFocus: "SQL, ETL, Data Modeling" },
    { title: "Security Engineer", responsibility: "Ensure application and data security", whyCritical: "Protect user data from day one", experience: "4+ years", industry: "Tech", skillFocus: "AppSec, Compliance, Pen Testing" },
  ],
  launch_gtm: [
    { title: "Social Media Manager", responsibility: "Build and engage community on social platforms", whyCritical: "Organic reach and brand awareness", experience: "2-4 years", industry: "Marketing", skillFocus: "Content Strategy, Community, Scheduling" },
    { title: "PR / Communications Specialist", responsibility: "Secure media coverage and manage public narrative", whyCritical: "Credibility through earned media", experience: "4-6 years", industry: "Marketing", skillFocus: "Media Relations, Press Releases, Storytelling" },
    { title: "Email Marketing Specialist", responsibility: "Build and optimize email campaigns and automation", whyCritical: "Direct, owned channel for conversions", experience: "3-5 years", industry: "Marketing", skillFocus: "Drip Campaigns, Segmentation, A/B Testing" },
  ],
  brand_design: [
    { title: "Motion Designer", responsibility: "Create animated content and micro-interactions", whyCritical: "Bring the brand to life with movement", experience: "3-5 years", industry: "Design", skillFocus: "After Effects, Lottie, CSS Animation" },
    { title: "Illustration Artist", responsibility: "Create custom illustrations for brand identity", whyCritical: "Unique visual language that stands out", experience: "3+ years", industry: "Design", skillFocus: "Digital Illustration, Brand Art, Icon Design" },
  ],
  technical_foundation: [
    { title: "Database Administrator", responsibility: "Optimize database performance and reliability", whyCritical: "Data integrity at scale", experience: "5+ years", industry: "Tech", skillFocus: "PostgreSQL, Indexing, Replication" },
    { title: "Frontend Architect", responsibility: "Design scalable frontend architecture", whyCritical: "Maintainable UI codebase", experience: "5-7 years", industry: "Tech", skillFocus: "React, Design Systems, Performance" },
    { title: "Security Architect", responsibility: "Design security framework and threat models", whyCritical: "Prevent vulnerabilities before they happen", experience: "6+ years", industry: "Tech", skillFocus: "Threat Modeling, IAM, Compliance" },
  ],
  growth_optimization: [
    { title: "Product Analyst", responsibility: "Deep-dive into user behavior and feature adoption", whyCritical: "Understand what drives engagement", experience: "3-5 years", industry: "Analytics", skillFocus: "Mixpanel, Amplitude, SQL" },
    { title: "UX Researcher", responsibility: "Conduct user interviews and usability testing", whyCritical: "Qualitative insights for optimization", experience: "3-5 years", industry: "Product", skillFocus: "User Interviews, A/B Testing, Surveys" },
  ],
  operations_scale: [
    { title: "People / HR Lead", responsibility: "Build hiring processes and team culture", whyCritical: "Scale the team sustainably", experience: "5+ years", industry: "Operations", skillFocus: "Recruiting, Culture, Onboarding" },
    { title: "Finance / Bookkeeper", responsibility: "Manage financial operations and reporting", whyCritical: "Financial clarity for scaling", experience: "3-5 years", industry: "Finance", skillFocus: "Accounting, Forecasting, Compliance" },
  ],
};

// Fallback generic roles
const GENERIC_ROLES: Omit<Role, "id">[] = [
  { title: "Full-Stack Developer", responsibility: "Build and maintain web applications end-to-end", whyCritical: "Core technical execution", experience: "5+ years", industry: "Tech", skillFocus: "React, Node.js, PostgreSQL" },
  { title: "UI/UX Designer", responsibility: "Design user interfaces and experiences", whyCritical: "User satisfaction and conversion", experience: "4+ years", industry: "Design", skillFocus: "Figma, User Research, Design Systems" },
  { title: "Product Manager", responsibility: "Define product strategy and roadmap", whyCritical: "Alignment and prioritization", experience: "5+ years", industry: "Product", skillFocus: "Roadmapping, Agile, Stakeholder Management" },
  { title: "DevOps Engineer", responsibility: "Manage infrastructure and deployments", whyCritical: "Reliability and scalability", experience: "4+ years", industry: "Tech", skillFocus: "AWS, Docker, CI/CD" },
  { title: "Marketing Strategist", responsibility: "Plan and execute marketing campaigns", whyCritical: "User acquisition and growth", experience: "5+ years", industry: "Marketing", skillFocus: "Growth Marketing, SEO, Analytics" },
  { title: "Data Analyst", responsibility: "Analyze data and provide insights", whyCritical: "Data-driven decisions", experience: "3+ years", industry: "Analytics", skillFocus: "SQL, Python, Data Visualization" },
];

interface AddRoleDialogProps {
  onAdd: (role: Role) => void;
  existingRoleIds: string[];
  teamType?: string;
}

const AddRoleDialog = ({ onAdd, existingRoleIds, teamType }: AddRoleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get contextual roles first, then generic as fallback
  const contextualRoles = teamType ? ROLE_SUGGESTIONS[teamType] || [] : [];
  const allRoles = [...contextualRoles, ...GENERIC_ROLES];

  const filteredRoles = allRoles.filter(
    (role) =>
      role.title.toLowerCase().includes(search.toLowerCase()) ||
      role.responsibility.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (roleData: Omit<Role, "id">) => {
    const newRole: Role = {
      ...roleData,
      id: `role-${Date.now()}`,
    };
    onAdd(newRole);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-2">
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a Role</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
          {contextualRoles.length > 0 && !search && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Recommended for your team
            </p>
          )}
          {filteredRoles.map((role, index) => {
            const skills = role.skillFocus?.split(",").map((s) => s.trim()).filter(Boolean) || [];
            return (
              <button
                key={index}
                onClick={() => handleAdd(role)}
                className="w-full p-4 rounded-xl border border-border text-left hover:border-accent/50 hover:bg-accent/5 transition-all"
              >
                <h4 className="font-medium text-foreground">{role.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{role.responsibility}</p>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 text-xs rounded-md bg-accent/10 text-accent-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {filteredRoles.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No roles found matching your search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoleDialog;
