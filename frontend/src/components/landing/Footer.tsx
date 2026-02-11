import { Link } from "react-router-dom";
import { Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">R</span>
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                Radah Works
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
              AI-powered team architecture that helps founders build the right team 
              for their project stage.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com/company/radahworks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com/radahworks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter/X"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => scrollToSection("how-it-works")} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("pricing")} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link to="/professionals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  For Professionals
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <address className="not-italic space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Radah Works LLC</p>
              <p>8301 State Line Rd. Ste 220 #3419</p>
              <p>Kansas City, MO 64114</p>
              <a href="tel:+18168948600" className="block hover:text-foreground transition-colors">
                +1 (816) 894-8600
              </a>
            </address>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Radah Works. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Radah Works provides team recommendations and introductions only. 
            All work agreements occur directly between parties.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
