import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Can't I just ask ChatGPT what roles I need?",
    a: "ChatGPT gives generic advice based on general knowledge. Radah's AI is trained on 1,000+ successful startup team structures and provides stage-specific, budget-aware recommendations. Plus, ChatGPT can't introduce you to pre-vetted professionals—you'd still spend 20+ hours hunting on LinkedIn.",
  },
  {
    q: "What if I'm not satisfied with my team architecture?",
    a: "We offer a 7-day money-back guarantee. If you're not satisfied for ANY reason, we'll refund you completely—no questions asked. 94% of founders say our structure exceeded their expectations.",
  },
  {
    q: "How are professionals vetted?",
    a: "Every professional in our network goes through a 3-step vetting process: (1) Portfolio review, (2) Technical/skill assessment, (3) Reference checks from previous clients. Only 7% of applicants make it into our network.",
  },
  {
    q: "Is this a freelance marketplace like Upwork?",
    a: "No. We're a team architecture intelligence platform. We help you understand WHO you need to hire and WHY, then connect you with pre-vetted professionals. We don't host the marketplace—all work agreements happen directly between you and the professionals.",
  },
  {
    q: "What happens after I get my team architecture?",
    a: "You receive a comprehensive PDF with your team structure, detailed reasoning, professional contacts, and hiring roadmap. You can reach out to professionals directly (we provide concierge intros in Pro tier). All hiring, contracts, and payments happen directly between parties.",
  },
  {
    q: "Do you take a cut of what I pay professionals?",
    a: "We charge a small 5% placement fee (capped at $2,500 per hire) only when you successfully hire through our platform. This helps us maintain quality and continue vetting professionals. The fee is significantly lower than traditional recruiters (15-25%).",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-secondary/30" id="faq">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">Everything you need to know</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
