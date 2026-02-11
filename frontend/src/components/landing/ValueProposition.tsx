import { Shield, Zap, Target, DollarSign } from "lucide-react";

const ValueProposition = () => {
  const values = [
    {
      icon: Target,
      title: "Precision Over Volume",
      description: "Not a marketplace of thousands. Curated teams matched to your exact project needs and stage.",
    },
    {
      icon: Zap,
      title: "Speed to Clarity",
      description: "Skip weeks of agency discovery. Get team architecture recommendations in under 10 minutes.",
    },
    {
      icon: Shield,
      title: "Pre-Vetted Professionals",
      description: "Every professional is reviewed and approved. No guesswork, no surprises.",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "$199 per team. One-time payment. No subscriptions, no hidden fees, no ongoing commitments.",
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              This is{" "}
              <span className="text-gradient-premium">not</span>{" "}
              a freelance marketplace.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Radah Works is a strategic team intelligence platform. We help founders understand 
              exactly which professionals they need — then connect them with vetted talent who 
              can execute.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Think of us as your AI-powered hiring strategist. We analyze your project, 
              recommend the right team structure, and give you direct access to professionals 
              who match your needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-border bg-card hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
