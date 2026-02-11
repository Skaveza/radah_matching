import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, CreditCard } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-premium text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Stop Guessing. Start Building the Right Team.
        </h2>
        <p className="text-primary-foreground/70 text-lg mb-12 max-w-2xl mx-auto">
          Get your AI-powered team architecture in under 10 minutes
        </p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
          {/* Free Option */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-left">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Start Free
            </p>
            <h3 className="font-display text-xl font-bold mb-1">Free Team Assessment</h3>
            <p className="text-sm text-primary-foreground/60 mb-5">
              See 3 critical roles • No credit card
            </p>
            <Button variant="outline" size="lg" asChild className="w-full group border-white/20 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <a href="#free-assessment">
                Get Free Assessment
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>

          {/* Paid Option */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-accent/30 text-left">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Complete Blueprint
            </p>
            <h3 className="font-display text-xl font-bold mb-1">
              $199{" "}
              <span className="text-sm font-normal text-primary-foreground/50 line-through">$299</span>
            </h3>
            <p className="text-sm text-primary-foreground/60 mb-5">
              Full team + vetted contacts • 7-day guarantee
            </p>
            <Button variant="premium" size="lg" asChild className="w-full group">
              <Link to="/intake">
                Get My Blueprint
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/50">
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Secure Payment
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" /> Stripe Secured
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> 7-Day Guarantee
          </span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
