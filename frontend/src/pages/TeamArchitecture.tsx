// src/pages/TeamArchitecture.tsx

import { useState, useEffect } from "react";
import { useProject } from "@/lib/ProjectContext";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ── TYPES ───────────────────────────────────────────────────────────────

type Professional = {
  id: string;
  name: string;
  primary_role: string;
  professional_summary: string;
  years_experience?: number;
  skills?: string[];
  contact?: string | null;
};

type TeamAPIResponse = {
  unlocked: boolean;
  team: {
    professional: Professional;
  }[];
};

type Role = {
  id: string;
  title: string;
  description: string;
  status: "planned" | "open" | "filled";
  professional: {
    name: string;
    experience: number | string;
    skills: string[];
    contact: string | null;
    locked: boolean;
  };
};

// ── COMPONENT ───────────────────────────────────────────────────────────

export default function TeamArchitecture() {
  const { currentProject } = useProject();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // ── LOAD TEAM ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentProject?.id) return;

    const loadTeam = async () => {
      setLoading(true);

      try {
        const token = await auth.currentUser?.getIdToken();

        const res = await apiFetch<TeamAPIResponse>(
          `/api/projects/${currentProject.id}/recommendation`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setIsUnlocked(res.unlocked);

        const mapped: Role[] = (res.team || []).map((m, idx) => {
          const p = m.professional;

          return {
            id: p?.id || `${idx}`,
            title: p?.primary_role || "Role",
            description: p?.professional_summary || "",
            status: "planned", // future: derive from backend
            professional: {
              name: p?.name || "Hidden",
              experience: p?.years_experience ?? "—",
              skills: p?.skills || [],
              contact: p?.contact || null,
              locked: !res.unlocked,
            },
          };
        });

        setRoles(mapped);
      } catch (e: any) {
        toast.error(e.message || "Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [currentProject?.id]);

  // ── PAYMENT ──────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!currentProject?.id) return;

    try {
      setPayLoading(true);

      const token = await auth.currentUser?.getIdToken();

      const res = await apiFetch<{ url: string }>(
        `/api/payments/checkout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: currentProject.id,
            plan: "blueprint",
          }),
        }
      );

      if (!res.url) throw new Error("No checkout URL");

      window.location.href = res.url;
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  // ── UI STATES ────────────────────────────────────────────────────────

  if (!currentProject) {
    return <div>No project selected</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold">Team Blueprint</h2>
        <p className="text-sm text-gray-500">
          Recommended team structure for your startup
        </p>
      </div>

      {/* TEAM GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>

      {/* CTA */}
      {!isUnlocked && (
        <div className="mt-10 p-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Unlock Your Team</h2>
          <p className="text-sm mb-6">
            Access full profiles, contact details, and start hiring.
          </p>

          <button
            onClick={handleCheckout}
            disabled={payLoading}
            className="px-6 py-3 bg-white text-black rounded-xl font-medium"
          >
            {payLoading ? "Redirecting..." : "Unlock for $199"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── ROLE CARD ──────────────────────────────────────────────────────────

const RoleCard = ({ role }: { role: Role }) => {
  const p = role.professional;

  return (
    <div className="bg-white border rounded-xl p-5 hover:shadow-sm transition">

      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{role.title}</h3>

        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
          {role.status}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-3">{role.description}</p>

      <div className="text-sm space-y-1">
        <p><strong>Name:</strong> {p.locked ? "Hidden" : p.name}</p>
        <p><strong>Experience:</strong> {p.experience}</p>
        <p><strong>Skills:</strong> {(p.skills || []).join(", ")}</p>

        {p.locked ? (
          <p className="text-xs text-gray-400 italic">
            Unlock to view contact details
          </p>
        ) : (
          <p><strong>Contact:</strong> {p.contact || "—"}</p>
        )}
      </div>
    </div>
  );
};