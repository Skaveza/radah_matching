import { FileText, Sparkles, Users, CreditCard } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      number: "01",
      title: "Describe Your Project",
      description: "Tell us about your business, stage, timeline, and goals. Our intelligent intake process captures exactly what you need.",
    },
    {
      icon: Sparkles,
      number: "02",
      title: "AI Generates Your Team",
      description: "Our AI analyzes your project and recommends the optimal team structure with roles tailored to your specific stage and budget.",
    },
    {
      icon: Users,
      number: "03",
      title: "Customize & Refine",
      description: "Add or remove roles as needed. Get AI-powered suggestions on how changes affect your timeline and costs.",
    },
    {
      icon: CreditCard,
      number: "04",
      title: "Unlock Your Team",
      description: "One-time $199 payment unlocks full contact details for your customized, pre-vetted professional team.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-secondary/30 scroll-mt-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            From Idea to Team in Minutes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A strategic, consultative process that feels like working with a top-tier agency — without the agency fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-px bg-border" />
              )}
              
              <div className="bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <step.icon className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-4xl font-display font-bold text-muted/30">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
