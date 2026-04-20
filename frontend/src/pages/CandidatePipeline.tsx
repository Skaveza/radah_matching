// src/pages/CandidatePipeline.tsx
import { useState, useEffect } from "react";
import { useProject } from "@/lib/ProjectContext";
import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
  bulkCreateItems,
  invokeLLM,
  RESOURCES,
} from "@/lib/projectApi";
import { UserCheck } from "lucide-react";

type Candidate = {
  id: string;
  name: string;
  role_id: string;
  status: string;
  score?: number;
};

type Role = {
  id: string;
  title: string;
};

export default function CandidatePipeline() {
  const { currentProject } = useProject();

  const [roles, setRoles] = useState<Role[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (!currentProject?.id) return;

    Promise.all([
      listItems<Role>(RESOURCES.TEAM_ROLES, currentProject.id),
      listItems<Candidate>(RESOURCES.CANDIDATES, currentProject.id),
    ]).then(([r, c]) => {
      setRoles(r);
      setCandidates(c);
    });
  }, [currentProject?.id]);

  const handleSelect = async (candidate: Candidate) => {
    await updateItem(RESOURCES.CANDIDATES, candidate.id, {
      status: "selected",
    });

    // ✅ CREATE TEAM MEMBER
    await createItem(RESOURCES.TEAM_MEMBERS, {
      project_id: currentProject?.id,
      name: candidate.name,
      role_id: candidate.role_id,
      performance_score: 0,
      workload: 0,
    });

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidate.id ? { ...c, status: "selected" } : c
      )
    );
  };

  return (
    <div>
      <h2>Candidate Pipeline</h2>

      {candidates.map((c) => (
        <div key={c.id}>
          <p>{c.name}</p>

          {c.status !== "selected" && (
            <button onClick={() => handleSelect(c)}>
              <UserCheck size={14} /> Select
            </button>
          )}
        </div>
      ))}
    </div>
  );
}