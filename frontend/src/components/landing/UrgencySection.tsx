import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

const UrgencySection = () => {
  return (
    <section className="py-20 bg-gradient-premium text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-accent" />
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">
            Limited Time
          </span>
        </div>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Early Adopter Pricing Ends Soon
        </h2>
        <p className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto">
          Lock in $199 pricing before it increases to $299 on February 28, 2026
        </p>

        <div className="mb-10">
          <CountdownTimer variant="large" />
        </div>

        <Button
          variant="premium"
          size="xl"
          asChild
          className="group"
        >
          <Link to="/intake">
            Lock In $199 Pricing Now
            <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <p className="text-sm text-primary-foreground/50 mt-4">
          Join 1,247 founders who've already locked in early pricing
        </p>
      </div>
    </section>
  );
};

export default UrgencySection;
