import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Radah saved me from hiring a senior developer when I actually needed a full-stack generalist first. Saved $18K and 3 months of runway.",
    name: "Marcus Rivera",
    title: "Founder, ChatFlow AI",
  },
  {
    quote:
      "I was about to post on Upwork with no strategy. Radah showed me I needed a technical PM BEFORE developers. Changed everything.",
    name: "Priya Patel",
    title: "Founder, HealthTrack",
  },
  {
    quote:
      "Got my team architecture in 12 minutes. The vetted professional contacts alone saved me 20+ hours of LinkedIn hunting.",
    name: "James Chen",
    title: "Founder, FinScore",
  },
];

const stats = [
  { value: "94%", label: "Match Rate", desc: "Founders say our structure matched their needs" },
  { value: "12 min", label: "Average Time", desc: "From signup to complete team architecture" },
  { value: "$11,400", label: "Avg Saved", desc: "Compared to traditional agency discovery" },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-secondary/30" id="testimonials">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Founders Love Radah Works
          </h2>
          <p className="text-muted-foreground text-lg">Real results from real founders</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card rounded-2xl border border-border p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-sm font-semibold text-accent mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
