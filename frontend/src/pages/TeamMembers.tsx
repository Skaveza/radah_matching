import { useState, useEffect } from "react";
import { useProject } from "@/lib/ProjectContext";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { Users, CheckCircle2, Clock } from "lucide-react";

// ── TYPES ─────────────────────────────────────────────
type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: "active" | "invited";
};

type TeamMembersResponse = {
  members: TeamMember[];
};

export default function TeamMembers() {
  const { currentProject } = useProject();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject?.id) return;

    const loadMembers = async () => {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();

        const res = await apiFetch<TeamMembersResponse>(
          `/api/team?project_id=${currentProject.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMembers(res.members || []);
      } catch (e) {
        console.error("Failed to load team", e);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [currentProject?.id]);

  const active = members.filter((m) => m.status === "active");
  const invited = members.filter((m) => m.status === "invited");

  if (loading) {
    return <div className="text-sm text-gray-500">Loading team...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Team Members</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Active Team" value={active.length} color="green" />
        <StatCard label="Pending Invites" value={invited.length} color="amber" />
      </div>

      {/* Active */}
      <Section title="Active Team" icon={<CheckCircle2 size={16} />}>
        {active.length === 0 ? (
          <Empty text="No active members yet" />
        ) : (
          active.map((m) => <MemberRow key={m.id} member={m} />)
        )}
      </Section>

      {/* Invited */}
      <Section title="Pending Invites" icon={<Clock size={16} />}>
        {invited.length === 0 ? (
          <Empty text="No pending invites" />
        ) : (
          invited.map((m) => <MemberRow key={m.id} member={m} />)
        )}
      </Section>
    </div>
  );
}

// ── UI ─────────────────────────────────────────────
const StatCard = ({ label, value, color }: any) => (
  <div className="bg-white border rounded-xl p-4 text-center">
    <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white border rounded-xl overflow-hidden">
    <div className="px-4 py-3 border-b flex items-center gap-2 font-medium">
      {icon} {title}
    </div>
    <div>{children}</div>
  </div>
);

const MemberRow = ({ member }: { member: TeamMember }) => (
  <div className="px-4 py-3 border-b last:border-0 flex justify-between">
    <div>
      <div className="font-medium">{member.name}</div>
      <div className="text-xs text-gray-500">{member.role}</div>
    </div>
    <div className="text-sm capitalize text-gray-600">
      {member.status}
    </div>
  </div>
);

const Empty = ({ text }: any) => (
  <div className="p-6 text-center text-gray-500 text-sm">
    <Users className="mx-auto mb-2" />
    {text}
  </div>
);