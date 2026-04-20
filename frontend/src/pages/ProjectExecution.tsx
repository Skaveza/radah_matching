// src/pages/ProjectExecution.tsx
import { useState, useEffect } from 'react';
import { useProject } from '@/lib/ProjectContext';
import {
  listItems, createItem, updateItem, deleteItem,
  bulkCreateItems, invokeLLM, RESOURCES,
} from '@/lib/projectApi';
import {
  Plus, Loader2, CheckCircle2, Clock, AlertCircle,
  Circle, Edit2, Trash2, Check, Sparkles, DollarSign,
} from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  not_started: { icon: Circle,       color: 'text-slate-400',  bg: 'bg-slate-100 text-slate-600',  label: 'Not Started' },
  in_progress: { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-100 text-amber-700',  label: 'In Progress' },
  completed:   { icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-100 text-green-700',  label: 'Completed'   },
  blocked:     { icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-100 text-red-600',      label: 'Blocked'     },
};

// ── Milestone Card ────────────────────────────────────────────────────────────
const MilestoneCard = ({
  milestone, onEdit, onDelete, onUpdateStatus,
}: {
  milestone: any;
  onEdit: (m: any) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) => {
  const conf = statusConfig[milestone.status] || statusConfig.not_started;
  const Icon = conf.icon;
  const cycleStatus: Record<string, string> = {
    not_started: 'in_progress', in_progress: 'completed',
    completed: 'not_started',   blocked: 'in_progress',
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
      milestone.status === 'blocked' ? 'border-red-200' : 'border-border'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onUpdateStatus(milestone.id, cycleStatus[milestone.status])}
          className="mt-0.5 shrink-0"
        >
          <Icon size={18} className={conf.color} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-base font-semibold text-foreground">{milestone.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(milestone)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => onDelete(milestone.id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {milestone.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.bg}`}>{conf.label}</span>
            {milestone.due_date && (
              <span className="text-xs text-muted-foreground">{milestone.due_date}</span>
            )}
            {milestone.responsible_role && (
              <span className="text-xs text-muted-foreground">· {milestone.responsible_role}</span>
            )}
            {milestone.budget_allocated && (
              <span className="text-xs text-muted-foreground">
                · ${Number(milestone.budget_allocated).toLocaleString()} total
              </span>
            )}
          </div>
          {milestone.status !== 'completed' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{milestone.progress || 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${milestone.progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Milestone Form ────────────────────────────────────────────────────────────
const MilestoneForm = ({
  milestone, onSave, onCancel, projectId,
}: {
  milestone: any | null; onSave: () => void; onCancel: () => void; projectId: string;
}) => {
  const [form, setForm] = useState(
    milestone || {
      title: '', description: '', start_date: '', due_date: '',
      status: 'not_started', progress: 0, budget_allocated: '',
      responsible_role: '', project_id: projectId,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form.id) {
        await updateItem(RESOURCES.MILESTONES, form.id, form);
      } else {
        await createItem(RESOURCES.MILESTONES, form);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
      <input
        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        placeholder="Milestone title" value={form.title}
        onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
      />
      <textarea
        className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        rows={2} placeholder="Description" value={form.description}
        onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={form.start_date}
          onChange={(e) => setForm((p: any) => ({ ...p, start_date: e.target.value }))}
        />
        <input
          type="date"
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={form.due_date}
          onChange={(e) => setForm((p: any) => ({ ...p, due_date: e.target.value }))}
        />
        <select
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={form.status}
          onChange={(e) => setForm((p: any) => ({ ...p, status: e.target.value }))}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <input
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Responsible role" value={form.responsible_role}
          onChange={(e) => setForm((p: any) => ({ ...p, responsible_role: e.target.value }))}
        />
        <input
          type="number"
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Budget allocated" value={form.budget_allocated}
          onChange={(e) => setForm((p: any) => ({ ...p, budget_allocated: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Progress: {form.progress}%</label>
        <input
          type="range" min="0" max="100" value={form.progress}
          onChange={(e) => setForm((p: any) => ({ ...p, progress: parseInt(e.target.value) }))}
          className="w-full accent-amber-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-muted">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!form.title || saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectExecution() {
  const { currentProject } = useProject();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!currentProject?.id) return;
    loadMilestones();
  }, [currentProject?.id]);

  const loadMilestones = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await listItems(RESOURCES.MILESTONES, currentProject.id);
      setMilestones(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteItem(RESOURCES.MILESTONES, id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateItem(RESOURCES.MILESTONES, id, { status });
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const handleAIGenerate = async () => {
    if (!currentProject) return;
    setGenerating(true);
    try {
      const res = await invokeLLM(
        `You are an expert startup execution advisor. Generate a practical execution roadmap.

Project: ${currentProject.name || 'Unnamed'}
Stage: ${currentProject.stage || 'early'}
Description: ${currentProject.description || ''}

Generate 6-8 concrete milestones for the next 6 months as JSON:
{
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "due_date": "YYYY-MM-DD",
      "responsible_role": "string",
      "status": "not_started"
    }
  ]
}
Return ONLY the JSON, no other text.`
      );

      let parsed: any;
      try {
        parsed = JSON.parse(res.replace(/```json|```/g, '').trim());
      } catch {
        console.error('[ProjectExecution] AI returned non-JSON:', res);
        return;
      }

      const items = (parsed.milestones || []).map((m: any) => ({
        ...m,
        project_id: currentProject.id,
        progress: 0,
        status: m.status || 'not_started',
      }));
      await bulkCreateItems(RESOURCES.MILESTONES, items);
      await loadMilestones();
    } finally {
      setGenerating(false);
    }
  };

  if (!currentProject) {
    return <div className="text-muted-foreground text-sm">No project selected.</div>;
  }

  const completed    = milestones.filter((m) => m.status === 'completed').length;
  const blocked      = milestones.filter((m) => m.status === 'blocked').length;
  const totalBudget  = milestones.reduce((s, m) => s + (Number(m.budget_allocated) || 0), 0);
  const projectBudget = currentProject.budget_total || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Execution Roadmap</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {completed}/{milestones.length} milestones complete
            {blocked > 0 ? ` · ${blocked} blocked` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAIGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 disabled:opacity-40"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating...' : 'AI Roadmap'}
          </button>
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90"
          >
            <Plus size={14} /> Add Milestone
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      {projectBudget > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-amber-500" />
            <h3 className="font-serif text-base font-semibold">Budget Overview</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-semibold font-sans">${(projectBudget / 1000).toFixed(0)}k</div>
              <div className="text-xs text-muted-foreground">Project Budget</div>
            </div>
            <div>
              <div className="text-xl font-semibold font-sans">${(totalBudget / 1000).toFixed(0)}k</div>
              <div className="text-xs text-muted-foreground">Allocated</div>
            </div>
            <div>
              <div className="text-xl font-semibold font-sans text-amber-600">
                ${((projectBudget - totalBudget) / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
              style={{ width: `${Math.min((totalBudget / projectBudget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <MilestoneForm
          milestone={editItem}
          projectId={currentProject.id}
          onSave={() => { setShowForm(false); setEditItem(null); loadMilestones(); }}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 bg-white rounded-2xl border border-dashed border-border text-center px-4">
          <Clock size={32} className="text-muted-foreground mb-3" />
          <h3 className="font-serif text-lg font-medium mb-1">No milestones yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Let AI generate your execution roadmap or add milestones manually
          </p>
          <button
            onClick={handleAIGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90"
          >
            <Sparkles size={14} /> Generate Roadmap
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
