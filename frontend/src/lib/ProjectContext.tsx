// src/lib/ProjectContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────
export type Project = {
  id: string;
  name: string;
  stage?: string;
  description?: string;
  status?: string;
  team_completion?: number;
  execution_progress?: number;
  investor_readiness_score?: number;
  budget_total?: number;
  budget_allocated?: number;
  problem_statement?: string;
  value_proposition?: string;
  target_market?: string;
  revenue_model?: string;
  competitive_landscape?: string;
  success_metrics?: string;
  mvp_scope?: string;
  created_at?: string;
  [key: string]: unknown;
};

// Shape returned by /api/projects
type ProjectRow = {
  project_id: string;
  // The API returns the project fields without 'id' — we add it from project_id
  project: Omit<Project, 'id'> & { name: string };
  team: unknown | null;
};

type ApiProjectsResponse = {
  success: boolean;
  projects: ProjectRow[];
};

type ProjectContextValue = {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (p: Project) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
};

// ── Context ────────────────────────────────────────────────
const ProjectContext = createContext<ProjectContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await apiFetch<ApiProjectsResponse>('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rows: ProjectRow[] = res?.projects ?? [];

      if (rows.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Normalize: merge project fields + attach id from project_id
      const normalized: Project[] = rows.map((row) => ({
        ...row.project,
        id: row.project_id,
      }));

      setProjects(normalized);

      // Restore previously selected project if it still exists in the list
      const stored = localStorage.getItem('radah_current_project');
      let active: Project | null = null;

      if (stored) {
        try {
          const saved = JSON.parse(stored) as { id?: string };
          if (saved?.id) {
            active = normalized.find((p) => p.id === saved.id) ?? null;
          }
        } catch {
          // Corrupt storage — ignore and fall through to first project
        }
      }

      if (!active) active = normalized[0];

      setCurrentProjectState(active);
      localStorage.setItem('radah_current_project', JSON.stringify(active));
    } catch (e) {
      console.error('[ProjectContext] failed to load projects', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Optimistically restore from localStorage for a fast initial render
    // so the UI doesn't flash empty while the network request is in flight
    const stored = localStorage.getItem('radah_current_project');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Project;
        if (parsed?.id && parsed?.name) {
          setCurrentProjectState(parsed);
        }
      } catch {
        // Ignore corrupt storage
      }
    }

    refreshProjects();
  }, [refreshProjects]);

  const switchProject = (project: Project) => {
    setCurrentProjectState(project);
    localStorage.setItem('radah_current_project', JSON.stringify(project));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject: switchProject,
        loading,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────
export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside <ProjectProvider />');
  return ctx;
}