import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type HeaderMode = "public" | "professional";

type HeaderProps = {
  mode?: HeaderMode;

  // professional UI custom text
  welcomeName?: string | null;
  subText?: string | null;

  // optional: show profile button on professional header
  showProfileButton?: boolean;
};

const Header = ({
  mode = "public",
  welcomeName,
  subText,
  showProfileButton = true,
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { signOut } = useAuth();

  const isProfessional = mode === "professional";

  const brandTitle = useMemo(() => {
    if (!isProfessional) return "Radah Works";
    const name = (welcomeName || "").trim();
    return name ? `Welcome Back, ${name}` : "Welcome Back";
  }, [isProfessional, welcomeName]);

  const brandSubtitle = useMemo(() => {
    if (!isProfessional) return null;
    return (subText || "").trim() || null;
  }, [isProfessional, subText]);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMobileNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    scrollToSection(sectionId);
  };

  const onSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch {
      // ignore; your useAuth likely toasts errors already
      navigate("/login");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="Radah Works" className="w-8 h-8 rounded-lg shrink-0" />

          <div className="min-w-0">
            <div className="font-display text-base md:text-xl font-semibold text-foreground truncate">
              {brandTitle}
            </div>
            {brandSubtitle ? (
              <div className="text-xs text-muted-foreground truncate -mt-0.5">
                {brandSubtitle}
              </div>
            ) : null}
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>

          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>

          {/* Public header only */}
          {!isProfessional ? (
            <>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>

              <Link
                to="/professional-apply"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                For Professionals
              </Link>
            </>
          ) : null}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {!isProfessional ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="premium" size="sm" asChild>
                <Link to="/intake">Design My Team</Link>
              </Button>
            </>
          ) : (
            <>
              {showProfileButton ? (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link to="/profile">
                    <User2 className="w-4 h-4" />
                    Profile
                  </Link>
                </Button>
              ) : null}

              <Button variant="outline" size="sm" onClick={onSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-background border-t border-border shadow-xl animate-in slide-in-from-top-2 fade-in duration-200">
          <nav className="flex flex-col p-6 gap-4 bg-background">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30"
            >
              Home
            </Link>

            <button
              onClick={() => handleMobileNavClick("how-it-works")}
              className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30"
            >
              How It Works
            </button>

            {!isProfessional ? (
              <>
                <button
                  onClick={() => handleMobileNavClick("pricing")}
                  className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30"
                >
                  Pricing
                </button>

                <Link
                  to="/professional-apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30"
                >
                  For Professionals
                </Link>

                <div className="pt-4 mt-2 flex flex-col gap-3">
                  <Button variant="outline" size="lg" asChild className="justify-center">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>

                  <Button variant="premium" size="lg" asChild className="justify-center">
                    <Link to="/intake" onClick={() => setMobileMenuOpen(false)}>
                      Design My Team
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className={cn("pt-4 mt-2 flex flex-col gap-3")}>
                {showProfileButton ? (
                  <Button variant="outline" size="lg" asChild className="justify-center gap-2">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User2 className="w-4 h-4" />
                      Profile
                    </Link>
                  </Button>
                ) : null}

                <Button variant="outline" size="lg" className="justify-center gap-2" onClick={onSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
