import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Mail, Linkedin, Phone, ExternalLink, Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnlockedProfessional {
  roleTitle: string;
  name: string;
  email: string;
  linkedin: string;
  phone?: string | null;
  portfolio?: string | null;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [professionals, setProfessionals] = useState<UnlockedProfessional[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verifying payment for session:", sessionId);
        
        const { data, error: fnError } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (fnError) {
          throw fnError;
        }

        if (data?.success) {
          setProfessionals(data.professionals || []);
          setTeamName(data.teamName || "Your Team");
          toast.success("Team contacts unlocked! Check your email for a copy.");
        } else {
          throw new Error(data?.error || "Verification failed");
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setError("Unable to verify payment. Please contact support.");
        toast.error("Payment verification failed");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Verifying your payment...
              </h1>
              <p className="text-muted-foreground mt-2">
                Please wait while we unlock your team contacts.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-4">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Team Unlocked Successfully!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your {teamName} contacts are ready. A confirmation email has been sent.
              </p>
            </div>

            {/* Professionals Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {professionals.map((pro, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-6 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mb-4">
                    <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                      {pro.roleTitle}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground text-lg mb-4">
                    {pro.name}
                  </h3>
                  
                  <div className="space-y-3">
                    <a 
                      href={`mailto:${pro.email}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {pro.email}
                    </a>
                    
                    <a 
                      href={pro.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      View LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    {pro.phone && (
                      <a 
                        href={`tel:${pro.phone}`}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {pro.phone}
                      </a>
                    )}
                    
                    {pro.portfolio && (
                      <a 
                        href={pro.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Portfolio
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-8 animate-fade-up">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Important:</strong> Radah Works provides team recommendations and introductions only. 
                All work agreements and payments occur directly between you and the professionals.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up">
              <Button variant="premium" size="lg" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/intake")}>
                Design Another Team
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
