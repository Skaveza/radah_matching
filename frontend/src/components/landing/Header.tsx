import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, LogOut } from "lucide-react";

interface HeaderProps {
  dashboardType?: "landing" | "entrepreneur" | "professional" | "admin";
  onRefresh?: () => void; // optional for admin dashboard
}

export const Header: React.FC<HeaderProps> = ({ dashboardType = "landing", onRefresh }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Determine which links to show
  const links: { label: string; href: string }[] = [];
  if (dashboardType === "landing") {
    links.push(
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "For Professionals", href: "#for-professionals" },
      { label: "Design My Team", href: "#design-my-team" }
    );
  } else if (dashboardType === "entrepreneur") {
    links.push(
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" }
    );
  } else if (dashboardType === "professional") {
    links.push(
      { label: "How It Works", href: "#how-it-works" },
      { label: "For Professionals", href: "#for-professionals" }
    );
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
            <span className="text-accent-foreground font-bold">R</span>
          </div>
        </Link>

        {/* Navigation links (not for admin) */}
        {dashboardType !== "admin" && (
          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Actions: refresh for admin, sign out otherwise */}
        <div className="flex items-center gap-4">
          {dashboardType === "admin" && onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}

          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
