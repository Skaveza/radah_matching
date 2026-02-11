import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Lock } from "lucide-react";

const FreeAssessment = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section className="py-24 bg-secondary/30 scroll-mt-16" id="free-assessment">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left Column */}
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              Start Free
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Not Ready to Buy? Start With Our Free Team Assessment
            </h2>
            <ul className="space-y-3 mb-8">
              {[
                "Answer 6 questions about your project",
                "Get 3 critical roles you need identified",
                "See high-level reasoning for each role",
                "No credit card • No commitment • 2 minutes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            {submitted ? (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <p className="font-semibold text-foreground">Check your email! 📧</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your free assessment link is on its way.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email to start free assessment"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                  aria-label="Email for free assessment"
                />
                <Button type="submit" variant="default" size="lg" className="group whitespace-nowrap">
                  Get My Free Assessment
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              1,847 founders started this week
            </p>
          </div>

          {/* Right Column - Preview Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Project</p>
                <p className="font-semibold text-foreground">AI-Powered Customer Support Tool</p>
                <p className="text-sm text-muted-foreground">Stage: Pre-MVP</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recommended Roles</p>
                <div className="space-y-3">
                  {[
                    { num: "1", role: "Full-Stack Developer", spec: "Python + React" },
                    { num: "2", role: "ML Engineer", spec: "NLP Specialist" },
                    { num: "3", role: "Product Manager", spec: "Technical Background" },
                  ].map((r) => (
                    <div key={r.num} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                        {r.num}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.role}</p>
                        <p className="text-xs text-muted-foreground">{r.spec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Blurred / locked section */}
              <div className="relative mt-4">
                <div className="blur-sm select-none pointer-events-none space-y-2 opacity-50">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-md">
                    <Lock className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      Unlock full details + vetted contacts → $199
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeAssessment;
