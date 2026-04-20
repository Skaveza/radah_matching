// src/pages/MyProjects.tsx

import { useState, useEffect } from 'react';
import { useProject, Project } from '@/lib/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { ArrowRight, Loader2 } from 'lucide-react';

import { getNextRouteForProject } from '@/lib/navigation/getNextRouteForProject';

// ── TYPES ─────────────────────────────────────────────────────

type RawProjectRow = {
  project: Project;
  project_id: string;
};

type ProjectsResponse = {
  success: boolean;
  projects?: RawProjectRow[];
};

// ── COMPONENT ─────────────────────────────────────────────────

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const { setCurrentProject } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  // ── LOAD PROJECTS ───────────────────────────────────────────

  const loadProjects = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await apiFetch<ProjectsResponse>('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res?.success) {
        console.error('[MyProjects] Failed response:', res);
        setProjects([]);
        return;
      }

      const normalized: Project[] = (res.projects ?? []).map((row) => ({
        ...row.project,
        id: row.project_id, // enforce consistent id
      }));

      setProjects(normalized);
    } catch (err) {
      console.error('[MyProjects] Error loading projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // ── OPEN PROJECT ────────────────────────────────────────────

  const handleOpen = async (project: Project) => {
    try {
      setCurrentProject(project);

      const route = await getNextRouteForProject(project.id);
      navigate(route);
    } catch (err) {
      console.error('[MyProjects] Navigation error:', err);
    }
  };

  // ── UI ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Projects</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No projects yet
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="border p-4 rounded-xl bg-white">
              <h3 className="font-semibold">{p.name}</h3>

              <button
                onClick={() => handleOpen(p)}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-black text-white rounded-xl text-sm"
              >
                Open <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}