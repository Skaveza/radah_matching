// src/pages/EntrepreneurDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProject } from "@/lib/ProjectContext";
import { listItems, RESOURCES } from "@/lib/projectApi";
import { getProjectFlow } from "@/lib/navigation/getNextRouteForProject";
import {
  ArrowRight, Flame, Users, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Zap, LayoutGrid, Target, Wallet, UserSearch, LineChart
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type Milestone = {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  progress?: number;
};
type Financial = { type: string; amount: number };

// ── Workspace nav cards ────────────────────────────────────
const NAV_ITEMS = [
  { label: "Projects",  href: "/projects",  Icon: LayoutGrid, desc: "Manage your ventures"  },
  { label: "Team",      href: "/team",      Icon: Users,      desc: "Roles & architecture"  },
  { label: "Pipeline",  href: "/pipeline",  Icon: UserSearch, desc: "Candidate tracking"    },
  { label: "Execution", href: "/execution", Icon: Target,     desc: "Milestones & tasks"    },
  { label: "Runway",    href: "/runway",    Icon: Wallet,     desc: "Budget & burn rate"    },
  { label: "Investors", href: "/investors", Icon: LineChart,  desc: "Readiness & reporting" },
];

// ── Milestone helpers ──────────────────────────────────────
const statusDot: Record<string, string> = {
  completed:   "bg-emerald-500",
  in_progress: "bg-amber-400",
  blocked:     "bg-red-500",
  not_started: "bg-slate-300",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed")   return <CheckCircle2 size={13} className="text-emerald-500" />;
  if (status === "in_progress") return <Clock        size={13} className="text-amber-500"   />;
  if (status === "blocked")     return <AlertTriangle size={13} className="text-red-500"    />;
  return null;
};

// ── Dashboard ──────────────────────────────────────────────
export default function EntrepreneurDashboard() {
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const [financials, setFinancials] = useState<Financial[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [flow, setFlow]             = useState<any>(null);

  useEffect(() => {
    if (!currentProject?.id) return;
    Promise.all([
      listItems<Financial>(RESOURCES.FINANCIAL_ENTRIES, currentProject.id),
      listItems<Milestone>(RESOURCES.MILESTONES,        currentProject.id),
      getProjectFlow(currentProject.id),
    ]).then(([fin, mil, flowData]) => {
      setFinancials(fin);
      setMilestones(mil);
      setFlow(flowData);
    });
  }, [currentProject?.id]);

  // ── Empty state ────────────────────────────────────────
  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
          <Zap size={26} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to Radah Works</h2>
        <p className="text-muted-foreground mb-6 max-w-xs text-sm leading-relaxed">
          Your startup execution hub. Start by creating your first project.
        </p>
        <Link
          to="/projects?new=1"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          Create first project <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  // ── Computed metrics ───────────────────────────────────
  const totalCosts   = financials.filter(f => f.type === "cost").reduce((s, f) => s + f.amount, 0);
  const totalRevenue = financials.filter(f => f.type === "revenue").reduce((s, f) => s + f.amount, 0);
  const burnRate     = Math.max(0, totalCosts - totalRevenue);
  const runway       = burnRate > 0 && currentProject.budget_total
    ? Math.floor(currentProject.budget_total / burnRate)
    : null;

  const blockedMilestones  = milestones.filter(m => m.status === "blocked");
  const upcomingMilestones = milestones.filter(m => m.status !== "completed").slice(0, 4);

  const metrics = [
    {
      label: "Runway",
      value: runway ? `${runway} mo` : "—",
      sub: burnRate > 0 ? `$${burnRate.toLocaleString()} / mo burn` : "No burn rate set",
      Icon: Flame,
      color: "text-orange-500",
      bg:    "bg-orange-50",
      href:  "/runway",
    },
    {
      label: "Team",
      value: `${currentProject.team_completion || 0}%`,
      sub:   "Completion",
      Icon:  Users,
      color: "text-blue-500",
      bg:    "bg-blue-50",
      href:  "/team",
    },
    {
      label: "Investor ready",
      value: `${currentProject.investor_readiness_score || 0}%`,
      sub:   (currentProject.investor_readiness_score || 0) < 50 ? "Keep building" : "Strong position",
      Icon:  TrendingUp,
      color: "text-emerald-500",
      bg:    "bg-emerald-50",
      href:  "/investors",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-amber-500 uppercase tracking-widest mb-1">
          {currentProject.stage || "Early stage"}
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {currentProject.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's where things stand today.
        </p>
      </div>

      {/* ── Next step banner ──────────────────────────── */}
      {flow && (
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white cursor-pointer group"
          onClick={() => navigate(flow.route)}
        >
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-4 -bottom-8 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium bg-white/20 rounded-full px-2.5 py-0.5">
                Step {flow.step.step} of {flow.step.total}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: flow.step.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-5 rounded-full transition-all ${
                      i < flow.step.step ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-white/70 mb-0.5">Recommended next step</p>
            <h3 className="text-lg font-semibold mb-4">{flow.step.label}</h3>

            <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              Continue <ArrowRight size={15} />
            </div>
          </div>
        </div>
      )}

      {/* ── Metrics row ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map(({ label, value, sub, Icon, color, bg, href }) => (
          <Link
            key={label}
            to={href}
            className="bg-white border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon size={15} className={color} />
            </div>
            <div className="text-xl font-semibold text-foreground leading-none mb-1">{value}</div>
            <div className="text-xs font-medium text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Milestones ────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm">Active milestones</h3>
          <Link
            to="/execution"
            className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-0.5 transition-colors"
          >
            View all <ChevronRight size={13} />
          </Link>
        </div>

        {upcomingMilestones.length === 0 ? (
          <div className="text-center py-7">
            <p className="text-sm text-muted-foreground mb-3">No milestones yet.</p>
            <Link
              to="/execution"
              className="text-xs font-medium text-amber-500 hover:text-amber-600 inline-flex items-center gap-1"
            >
              Add milestones <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMilestones.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[m.status] ?? "bg-slate-200"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{m.title}</div>
                  {m.due_date && (
                    <div className="text-xs text-muted-foreground">{m.due_date}</div>
                  )}
                </div>
                <div className="shrink-0">
                  <StatusIcon status={m.status} />
                </div>
              </div>
            ))}

            {blockedMilestones.length > 0 && (
              <div className="mt-1 pt-3 border-t border-border flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">
                  {blockedMilestones.length} blocker{blockedMilestones.length > 1 ? "s" : ""} need attention
                </p>
                <Link to="/execution" className="ml-auto text-xs text-red-500 hover:underline">
                  Fix →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Workspace nav ─────────────────────────────── */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 px-0.5">
          Workspace
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {NAV_ITEMS.map(({ label, href, Icon, desc }) => (
            <Link
              key={label}
              to={href}
              className="group flex items-center gap-3 bg-white border border-border rounded-xl p-3.5 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                <Icon size={15} className="text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground leading-none mb-0.5">{label}</div>
                <div className="text-xs text-muted-foreground truncate">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}