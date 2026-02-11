import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Crown, Zap, Users, Calendar, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const tiers = [
    {
      id: "blueprint",
      name: "Team Blueprint",
      tagline: "Your roadmap to the perfect team",
      price: 199,
      period: "one-time",
      description: "Get a complete team architecture with vetted professional contacts. Perfect for founders ready to build.",
      icon: Zap,
      popular: true,
      cta: "Get My Blueprint",
      originalPrice: 299,
      socialProof: "487 founders chose this plan this month",
      features: [
        { text: "Complete team architecture (4-7 roles)", highlight: true },
        { text: "Detailed reasoning for each role", highlight: false },
        { text: "Pre-vetted professional contact per role", highlight: true },
        { text: "Skills matrix & hiring sequence roadmap", highlight: false },
        { text: "Salary benchmarking by role & geography", highlight: false },
        { text: "7-day satisfaction guarantee", highlight: false },
        { text: "Lifetime access to team snapshot", highlight: false },
      ],
    },
    {
      id: "blueprint-pro",
      name: "Team Blueprint Pro",
      tagline: "White-glove team building support",
      price: 399,
      period: "one-time",
      description: "Everything in Blueprint plus concierge service, multiple scenarios, and ongoing support.",
      icon: Crown,
      popular: false,
      cta: "Get Pro Access",
      originalPrice: 599,
      socialProof: "Best for funded founders who value time",
      features: [
        { text: "Everything in Team Blueprint", highlight: true },
        { text: "2 team scenarios (MVP + Scale)", highlight: true },
        { text: "Concierge email introductions", highlight: true },
        { text: "30-day Slack/email support", highlight: false },
        { text: "Priority matching (24hr guarantee)", highlight: true },
        { text: "1 free team refresh within 90 days", highlight: false },
        { text: "Custom onboarding templates", highlight: false, coming: true },
      ],
    },
    {
      id: "architect",
      name: "Team Architect",
      tagline: "Your ongoing team strategist",
      price: 149,
      period: "month",
      description: "Unlimited architectures and refreshes. Perfect for serial founders or agencies building multiple teams.",
      icon: Sparkles,
      popular: false,
      cta: "Start Membership",
      socialProof: "Perfect for serial founders building multiple products",
      features: [
        { text: "Unlimited team architectures", highlight: true },
        { text: "Unlimited refreshes as projects evolve", highlight: true },
        { text: "Priority access to new professionals", highlight: false },
        { text: "Monthly team health check review", highlight: true },
        { text: "Founder Circle community access", highlight: false },
        { text: "Early access to new features", highlight: false },
        { text: "Quarterly 1:1 consultation (30 min)", highlight: true },
        { text: "2 guest blueprints/month", highlight: false },
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-premium text-primary-foreground scroll-mt-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Simple, Transparent Pricing
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Choose Your Path to the Perfect Team
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
            From single project blueprints to unlimited team strategy. 
            No hidden fees. No marketplace noise. Just clarity.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative bg-card text-card-foreground rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1",
                tier.popular
                  ? "shadow-premium ring-2 ring-accent lg:scale-105"
                  : "shadow-lg hover:shadow-xl"
              )}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className={cn("p-8", tier.popular && "pt-14")}>
                {/* Tier Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    tier.popular ? "bg-accent/20" : "bg-muted"
                  )}>
                    <tier.icon className={cn(
                      "w-6 h-6",
                      tier.popular ? "text-accent" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.tagline}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {tier.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${tier.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl md:text-5xl font-display font-bold text-foreground">
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground">
                      {tier.period === "month" ? "/month" : "one-time"}
                    </span>
                  </div>
                  {tier.period === "month" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed monthly • Cancel anytime
                    </p>
                  )}
                  {tier.period === "one-time" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      One-time payment • Lifetime access
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {tier.description}
                </p>

                {/* CTA Button */}
                <Button
                  variant={tier.popular ? "premium" : "default"}
                  size="lg"
                  asChild
                  className="w-full group mb-8"
                >
                  <Link to="/intake">
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    What's included
                  </p>
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        feature.highlight ? "bg-accent/20" : "bg-muted"
                      )}>
                        <Check className={cn(
                          "w-3 h-3",
                          feature.highlight ? "text-accent" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm",
                        feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {feature.text}
                        {feature.coming && (
                          <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            Coming soon
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ROI Box for Blueprint tier */}
                {tier.id === "blueprint" && (
                  <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Value Calculator</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Typical hiring mistakes</span>
                        <span className="font-medium text-foreground">$8,000–$15,000</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Your investment</span>
                        <span className="font-medium text-foreground">$199</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between font-semibold text-accent">
                        <span>Your savings</span>
                        <span>40x–75x return</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social proof */}
                {tier.socialProof && (
                  <p className="mt-4 text-xs text-muted-foreground text-center">
                    {tier.socialProof}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
            <ComparisonItem
              icon={Users}
              label="vs. Agencies"
              value="Save $10k+"
            />
            <div className="hidden sm:block w-px h-8 bg-primary-foreground/20" />
            <ComparisonItem
              icon={Calendar}
              label="vs. DIY Hiring"
              value="Save 40+ hours"
            />
            <div className="hidden sm:block w-px h-8 bg-primary-foreground/20" />
            <ComparisonItem
              icon={Shield}
              label="Guarantee"
              value="7-day refund"
            />
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-12 text-center">
          <p className="text-primary-foreground/70 text-sm mb-4">
            Not sure which tier is right for you?
          </p>
          <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-white/10">
            Compare all features
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-xs text-primary-foreground/50 mt-12 max-w-md mx-auto text-center">
          Radah Works provides team architecture and professional introductions only.
          All work agreements and payments occur directly between parties.
        </p>
      </div>
    </section>
  );
};

const ComparisonItem = ({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <Icon className="w-5 h-5 text-accent" />
    <div className="text-left">
      <p className="text-xs text-primary-foreground/60">{label}</p>
      <p className="text-sm font-semibold text-primary-foreground">{value}</p>
    </div>
  </div>
);

export default Pricing;
