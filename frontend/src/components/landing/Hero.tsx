import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

const Hero = () => {
  const benefits = [
    "Structured teams, not random freelancers",
    "Built for your project stage",
    "Pre-vetted professionals",
    "One-time payment per team",
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Urgency Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
            <span className="text-sm font-medium text-accent-foreground">
              ⚡ Early Adopter Pricing • $199
            </span>
            <span className="hidden sm:inline text-muted-foreground text-sm">•</span>
            <span className="hidden sm:inline">
              <CountdownTimer variant="badge" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Know exactly who to hire —{" "}
            <span className="text-gradient-premium">before you hire anyone.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            AI-powered team architecture that replaces $10,000+ agency discovery fees. 
            Get the right team structure for your project in minutes.
          </p>

          {/* CTA Buttons - Dual hierarchy */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#free-assessment" className="group">
                Get Free Team Assessment
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/intake">Get Complete Blueprint — $199</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-10 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            See 3 roles you need • No credit card • 2 minutes
          </p>

          {/* Social proof line */}
          <p className="text-sm text-muted-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            Join <span className="font-semibold text-foreground">1,247 founders</span> who've designed their teams
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
