// src/layouts/DashboardLayout.tsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/lib/ProjectContext";
import {
  LayoutDashboard, FolderOpen, Users, UserSearch,
  CheckSquare, Wallet, TrendingUp, LogOut, ChevronDown,
  Check, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_MAIN = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Projects",  href: "/projects",  Icon: FolderOpen      },
  { label: "Team",      href: "/team",      Icon: Users           },
];

const NAV_WORKSPACE = [
  { label: "Pipeline",  href: "/pipeline",  Icon: UserSearch  },
  { label: "Execution", href: "/execution", Icon: CheckSquare },
  { label: "Runway",    href: "/runway",    Icon: Wallet      },
  { label: "Investors", href: "/investors", Icon: TrendingUp  },
];

const NavItem = ({
  href, Icon, label, active, onClick,
}: {
  href: string; Icon: React.ElementType; label: string; active: boolean; onClick?: () => void;
}) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
      active
        ? "bg-amber-50 text-amber-700 font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    )}
  >
    <Icon size={15} className={active ? "text-amber-500" : ""} />
    {label}
  </Link>
);

function ProjectSwitcher() {
  const { projects, currentProject, setCurrentProject } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!currentProject) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/60 hover:bg-muted border border-border/50 rounded-lg px-3 py-1.5 transition-colors"
      >
        <span className="max-w-[140px] truncate">{currentProject.name}</span>
        <ChevronDown size={13} className={cn("text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 min-w-[200px] bg-background border border-border rounded-xl shadow-lg py-1.5 overflow-hidden">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-1.5">
            Your projects
          </p>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => { setCurrentProject(p); setOpen(false); }}
              >
                <span className="truncate text-left">{p.name}</span>
                {p.id === currentProject.id && (
                  <Check size={13} className="text-amber-500 shrink-0 ml-2" />
                )}
              </button>
            ))
          )}
          <div className="border-t border-border mt-1 pt-1">
            <Link
              to="/projects"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
            >
              Manage projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNav, onSignOut }: { onNav?: () => void; onSignOut: () => void }) {
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex flex-col h-full py-4 px-3">
      <Link to="/" onClick={onNav} className="flex items-center gap-2.5 px-1 mb-6">
        <img
          src="/logo.png"
          alt="Radah Works"
          className="w-7 h-7 rounded-lg shrink-0 object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <span className="font-semibold text-sm text-foreground tracking-tight">Radah Works</span>
      </Link>

      <div className="space-y-0.5 mb-4">
        {NAV_MAIN.map(({ href, Icon, label }) => (
          <NavItem key={href} href={href} Icon={Icon} label={label} active={isActive(href)} onClick={onNav} />
        ))}
      </div>

      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 mb-2 mt-2">
        Workspace
      </p>
      <div className="space-y-0.5 flex-1">
        {NAV_WORKSPACE.map(({ href, Icon, label }) => (
          <NavItem key={href} href={href} Icon={Icon} label={label} active={isActive(href)} onClick={onNav} />
        ))}
      </div>

      <button
        onClick={onSignOut}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all mt-4 w-full"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try { await signOut(); } finally { navigate("/login"); }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-border bg-background">
        <SidebarContent onSignOut={handleSignOut} />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-background border-r border-border h-full z-10 shadow-xl">
            <SidebarContent onNav={() => setMobileOpen(false)} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-12 shrink-0 border-b border-border bg-background flex items-center justify-between px-4 gap-3">
          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center min-w-0">
            <ProjectSwitcher />
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-xs font-medium text-amber-700">Me</span>
            </div>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}