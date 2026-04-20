// src/pages/TeamPerformance.tsx
import { useEffect, useState } from "react";
import { useProject } from "@/lib/ProjectContext";
import { listItems, updateItem, RESOURCES } from "@/lib/projectApi";

type Member = {
  id: string;
  name: string;
  role_id: string;
  performance_score: number;
};

type Milestone = {
  id: string;
  title: string;
  status: string;
  owner_id?: string;
};

export default function TeamPerformance() {
  const { currentProject } = useProject();

  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!currentProject?.id) return;

    Promise.all([
      listItems<Member>(RESOURCES.TEAM_MEMBERS, currentProject.id),
      listItems<Milestone>(RESOURCES.MILESTONES, currentProject.id),
    ]).then(([m, ms]) => {
      setMembers(m);
      setMilestones(ms);
    });
  }, [currentProject?.id]);

  // ✅ Calculate performance from milestones
  const getPerformance = (memberId: string) => {
    const assigned = milestones.filter((m) => m.owner_id === memberId);
    if (assigned.length === 0) return 0;

    const completed = assigned.filter((m) => m.status === "completed").length;
    return Math.round((completed / assigned.length) * 100);
  };

  const updatePerformance = async (member: Member) => {
    const score = getPerformance(member.id);

    await updateItem(RESOURCES.TEAM_MEMBERS, member.id, {
      performance_score: score,
    });

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id ? { ...m, performance_score: score } : m
      )
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Team Performance</h2>

      {members.map((m) => {
        const liveScore = getPerformance(m.id);

        return (
          <div key={m.id} className="p-4 border rounded-xl">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-500">{m.role_id}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold">{liveScore}%</p>
                <button
                  onClick={() => updatePerformance(m)}
                  className="text-xs text-blue-500"
                >
                  Sync
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}