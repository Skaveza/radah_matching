import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Mail,
  Linkedin,
  Phone,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Header from "@/components/landing/Header";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

interface UnlockedProfessional {
  roleTitle: string;
  name: string;
  email: string;
  linkedin: string;
  phone?: string | null;
  portfolio?: string | null;
}

interface VerifyResponse {
  success: boolean;
  teamName?: string;
  professionals?: UnlockedProfessional[];
  message?: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [professionals, setProfessionals] = useState<UnlockedProfessional[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setError("Missing session ID.");
        setLoading(false);
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Authentication required.");

        const res = await apiFetch<VerifyResponse>("/api/payments/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!res.success) throw new Error(res.message || "Verification failed.");

        setProfessionals(res.professionals || []);
        setTeamName(res.teamName || "Your Team");
        toast.success("Team unlocked successfully!");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Payment verification failed.");
        toast.error("Payment verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">Verification Failed</h1>
          <p className="mb-6">{error}</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Team Unlocked!</h1>
            <p className="text-muted-foreground">
              Your {teamName} contacts are ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {professionals.map((pro, i) => (
              <div key={i} className="bg-card border rounded-2xl p-6">
                <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                  {pro.roleTitle}
                </span>
                <h3 className="text-lg font-semibold mt-3 mb-4">{pro.name}</h3>

                <div className="space-y-3 text-sm">
                  <a href={`mailto:${pro.email}`} className="flex gap-2">
                    <Mail className="w-4 h-4" />
                    {pro.email}
                  </a>

                  <a href={pro.linkedin} target="_blank" rel="noopener noreferrer" className="flex gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>

                  {pro.phone && (
                    <a href={`tel:${pro.phone}`} className="flex gap-2">
                      <Phone className="w-4 h-4" />
                      {pro.phone}
                    </a>
                  )}

                  {pro.portfolio && (
                    <a href={pro.portfolio} target="_blank" rel="noopener noreferrer" className="flex gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/dashboard")}>
              Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
