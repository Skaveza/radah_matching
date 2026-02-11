import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  "Cost",
  "Time Investment",
  "Stage-Specific Advice",
  "Vetted Professional Contacts",
  "Data-Backed Recommendations",
  "Hiring Sequence Roadmap",
  "Salary Benchmarking",
];

type CellValue = string | boolean;

const columns: { name: string; highlight?: boolean; values: CellValue[] }[] = [
  { name: "DIY Research", values: ["Free", "40+ hours", false, false, false, false, false] },
  { name: "ChatGPT", values: ["$20/mo", "2-4 hours", false, false, false, false, false] },
  { name: "Upwork", values: ["Free", "10+ hours", false, false, false, false, false] },
  { name: "Agency", values: ["$10,000+", "2-8 weeks", true, true, true, true, true] },
  { name: "Radah Works", highlight: true, values: ["$199", "10 minutes", true, true, true, true, true] },
];

const ComparisonTable = () => {
  return (
    <section className="py-24" id="comparison">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Not Just Use ChatGPT or Upwork?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how Radah Works compares to alternatives
          </p>
        </div>

        <div className="max-w-5xl mx-auto overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium" />
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className={cn(
                      "py-3 px-4 text-center font-semibold",
                      col.highlight
                        ? "bg-accent/10 text-foreground rounded-t-xl"
                        : "text-muted-foreground"
                    )}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feat, ri) => (
                <tr key={feat} className="border-t border-border/50">
                  <td className="py-3 px-4 font-medium text-foreground">{feat}</td>
                  {columns.map((col) => {
                    const val = col.values[ri];
                    return (
                      <td
                        key={col.name}
                        className={cn(
                          "py-3 px-4 text-center",
                          col.highlight && "bg-accent/5",
                          ri === features.length - 1 && col.highlight && "rounded-b-xl"
                        )}
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className={col.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}>
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Callout */}
        <div className="max-w-3xl mx-auto mt-10 p-6 rounded-2xl bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">ChatGPT gives generic advice.</span>{" "}
            Radah gives you stage-specific architecture based on 1,000+ successful team builds + direct access to vetted professionals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
