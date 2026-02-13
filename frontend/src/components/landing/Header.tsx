import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Radah Works" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-xl font-semibold text-foreground">
            Radah Works
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>
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
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="premium" size="sm" asChild>
            <Link to="/intake">Design My Team</Link>
          </Button>
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
            <button
              onClick={() => handleMobileNavClick("how-it-works")}
              className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{ animationDelay: "50ms" }}
            >
              How It Works
            </button>

            <button
              onClick={() => handleMobileNavClick("pricing")}
              className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{ animationDelay: "100ms" }}
            >
              Pricing
            </button>

            {/* ✅ FIX: was /professionals (404) */}
            <Link
              to="/professional-apply"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-foreground hover:text-accent transition-colors py-3 border-b border-border/30 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{ animationDelay: "150ms" }}
            >
              For Professionals
            </Link>

            <div
              className="pt-4 mt-2 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
              style={{ animationDelay: "200ms" }}
            >
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
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
