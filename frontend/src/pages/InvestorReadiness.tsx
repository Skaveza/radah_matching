// src/pages/InvestorReadiness.tsx
import { useState, useEffect } from 'react';
import { useProject } from '@/lib/ProjectContext';
import {
  listItems, createItem, updateItem, invokeLLM,
  updateProject, RESOURCES,
} from '@/lib/projectApi';
import {
  Sparkles, TrendingUp, Loader2, FileText, BarChart3,
  Users, DollarSign, CheckSquare, Square, Download,
} from 'lucide-react';

const ScoreSection = ({
  label, score, description,
}: {
  label: string; score: number; description?: string;
}) => (
  <div className="flex items-center gap-4">
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-amber-600">{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            background: score >= 70 ? 'hsl(142,71%,45%)' : score >= 40 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,51%)',
          }}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  </div>
);

const pitchChecklist = [
  { id: 'problem',     label: 'Problem & market size defined',  field: 'problem_statement'    },
  { id: 'solution',    label: 'Solution & product described',   field: 'value_proposition'    },
  { id: 'market',      label: 'Target market & ICP defined',    field: 'target_market'        },
  { id: 'revenue',     label: 'Revenue model established',      field: 'revenue_model'        },
  { id: 'competition', label: 'Competitive analysis done',      field: 'competitive_landscape'},
  { id: 'metrics',     label: 'Success metrics defined',        field: 'success_metrics'      },
  { id: 'team',        label: 'Core team structure ready',      field: null, dynamic: 'team_completion' },
  { id: 'mvp',         label: 'MVP scope defined',              field: 'mvp_scope'            },
];

export default function InvestorReadiness() {
  const { currentProject, setCurrentProject } = useProject();
  const [generating, setGenerating]       = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle]     = useState('');
  const [activeTab, setActiveTab]         = useState('score');
  const [savedDocs, setSavedDocs]         = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved]   = useState(true);

  useEffect(() => {
    if (!currentProject?.id) return;
    listItems(RESOURCES.SAVED_DOCUMENTS, currentProject.id)
      .then(setSavedDocs)
      .finally(() => setLoadingSaved(false));
  }, [currentProject?.id]);

  if (!currentProject) return <div className="text-muted-foreground text-sm">No project selected.</div>;

  const score = currentProject.investor_readiness_score || 0;

  const sections = [
    { label: 'Problem & Market Clarity',  score: currentProject.problem_statement    ? 85 : 20, description: currentProject.problem_statement    ? 'Well defined' : 'Complete your problem statement' },
    { label: 'Value Proposition',         score: currentProject.value_proposition     ? 80 : 15, description: currentProject.value_proposition     ? 'Defined'      : 'Define your value proposition'   },
    { label: 'Team Architecture',         score: currentProject.team_completion       || 10,      description: `${currentProject.team_completion || 0}% of team roles filled` },
    { label: 'Revenue Model',             score: currentProject.revenue_model         ? 75 : 20, description: currentProject.revenue_model         ? 'Defined'      : 'Add revenue model details'        },
    { label: 'Execution Progress',        score: currentProject.execution_progress    || 5,       description: `${currentProject.execution_progress || 0}% milestones complete` },
    { label: 'Competitive Landscape',     score: currentProject.competitive_landscape ? 70 : 15, description: currentProject.competitive_landscape ? 'Analyzed'     : 'Add competitive analysis'         },
  ];

  const avgScore = Math.round(sections.reduce((s, sec) => s + sec.score, 0) / sections.length);

  const handleRecalculate = async () => {
    await updateProject(currentProject.id, { investor_readiness_score: avgScore });
    setCurrentProject({ ...currentProject, investor_readiness_score: avgScore });
  };

  const handleGenerate = async (type: string, label: string) => {
    setGenerating(true);
    setGeneratedTitle(label);
    setActiveTab('document');

    const prompts: Record<string, string> = {
      summary: `Write a professional investor summary for this startup.
Project: ${currentProject.name} | Stage: ${currentProject.stage}
Description: ${currentProject.description || ''}
Problem: ${currentProject.problem_statement || ''}
Value Proposition: ${currentProject.value_proposition || ''}
Revenue Model: ${currentProject.revenue_model || ''}
Target Market: ${currentProject.target_market || ''}
Write 3 paragraphs: problem & opportunity, solution & traction, the ask & vision.`,

      onepager: `Create a professional one-pager for investor outreach.
Project: ${currentProject.name} | Stage: ${currentProject.stage}
Description: ${currentProject.description || ''}
Format with sections: Overview, Problem, Solution, Market, Business Model, Team Needs, Why Now.`,

      brief: `Write a concise executive brief for potential investors.
Project: ${currentProject.name} | Stage: ${currentProject.stage}
Value Proposition: ${currentProject.value_proposition || ''}
Revenue Model: ${currentProject.revenue_model || ''}
Competitive Landscape: ${currentProject.competitive_landscape || ''}
Make it punchy, highlight key differentiators, investment opportunity, and financial projections.`,

      pitch_narrative: `Write a compelling pitch narrative for ${currentProject.name}.
Stage: ${currentProject.stage}
Problem: ${currentProject.problem_statement || ''}
Market: ${currentProject.target_market || ''}
Solution: ${currentProject.value_proposition || ''}
Revenue: ${currentProject.revenue_model || ''}
Tell the story in first person as the founder. Open with a customer pain point, build through the solution, market opportunity, and end with the vision. 400-500 words.`,
    };

    try {
      const res = await invokeLLM(prompts[type]);
      setGeneratedContent(res);

      // Auto-save / update
      const existing = savedDocs.find((d) => d.doc_type === type);
      if (existing) {
        await updateItem(RESOURCES.SAVED_DOCUMENTS, existing.id, { content: res });
        setSavedDocs((prev) => prev.map((d) => (d.id === existing.id ? { ...d, content: res } : d)));
      } else {
        const saved = await createItem<any>(RESOURCES.SAVED_DOCUMENTS, {
          project_id: currentProject.id, doc_type: type, title: label, content: res,
        });
        setSavedDocs((prev) => [...prev, saved]);
      }

      // Log activity
      await createItem(RESOURCES.ACTIVITIES, {
        project_id: currentProject.id,
        type: 'investor',
        title: `Generated: ${label}`,
        description: 'Investor document created',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${title.replace(/ /g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'score',     label: 'Score'    },
    { id: 'checklist', label: 'Checklist'},
    { id: 'documents', label: 'AI Docs'  },
    { id: 'document',  label: 'Preview'  },
    { id: 'saved',     label: `Saved${savedDocs.length > 0 ? ` (${savedDocs.length})` : ''}` },
  ];

  const checklistItems = pitchChecklist.map((item) => ({
    ...item,
    done: item.field
      ? !!(currentProject as any)[item.field]
      : (item.dynamic === 'team_completion' ? (currentProject.team_completion || 0) >= 50 : false),
  }));
  const checklistScore = Math.round(
    (checklistItems.filter((i) => i.done).length / checklistItems.length) * 100
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Investor Readiness</h2>
          <p className="text-muted-foreground text-sm mt-1">Track your fundraising readiness and generate materials</p>
        </div>
        <button
          onClick={handleRecalculate}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90"
        >
          <TrendingUp size={14} /> Recalculate
        </button>
      </div>

      {/* Score Hero */}
      <div className="bg-gradient-to-br from-[hsl(220,25%,12%)] to-[hsl(220,20%,22%)] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-amber-400/70 text-sm mb-2">Investor Readiness Score</div>
            <div className="text-6xl font-bold font-sans">
              {score}<span className="text-3xl text-amber-400/70">%</span>
            </div>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">
              {score < 30 ? 'Early stage. Focus on defining your problem and market.'
               : score < 50 ? 'Making progress. Build out your team and refine your model.'
               : score < 70 ? 'Strong foundation. Work on traction and financial projections.'
               : score < 85 ? 'Looking good. Polish your deck and practice your pitch.'
               : "Investor ready. You're in strong position to fundraise."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Checklist</div>
            <div className="text-2xl font-bold text-amber-400">{checklistScore}%</div>
            <div className="text-xs text-slate-500">
              {checklistItems.filter((i) => i.done).length}/{checklistItems.length} done
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Score Tab */}
      {activeTab === 'score' && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <h3 className="font-serif text-base font-semibold">Score Breakdown</h3>
          {sections.map((s) => <ScoreSection key={s.label} {...s} />)}
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-serif text-base font-semibold mb-4">Pitch Readiness Checklist</h3>
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.done ? 'bg-green-50' : 'bg-muted/40'}`}
              >
                {item.done
                  ? <CheckSquare size={18} className="text-green-500 shrink-0" />
                  : <Square size={18} className="text-muted-foreground shrink-0" />}
                <span className={`text-sm ${item.done ? 'text-green-800 line-through decoration-green-400/50' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${checklistScore}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {checklistItems.filter((i) => i.done).length} of {checklistItems.length} items complete — {checklistScore}% pitch ready
          </p>
        </div>
      )}

      {/* AI Docs Tab */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 gap-3">
          {[
            { type: 'summary',         title: 'Investor Summary',  desc: 'A compelling 3-paragraph overview',       icon: Users     },
            { type: 'onepager',        title: 'One-Pager',         desc: 'Clean doc covering all key aspects',      icon: FileText  },
            { type: 'brief',           title: 'Executive Brief',   desc: 'Punchy brief highlighting differentiators',icon: BarChart3 },
            { type: 'pitch_narrative', title: 'Pitch Narrative',   desc: 'Founder story for in-person pitches',     icon: Sparkles  },
          ].map((doc) => {
            const saved = savedDocs.find((d) => d.doc_type === doc.type);
            return (
              <div key={doc.type} className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <doc.icon size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-base font-semibold">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground">{doc.desc}</p>
                  {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
                </div>
                <div className="flex gap-2">
                  {saved && (
                    <button
                      onClick={() => { setGeneratedContent(saved.content); setGeneratedTitle(doc.title); setActiveTab('document'); }}
                      className="px-3 py-2 text-sm border border-border rounded-xl hover:bg-muted text-muted-foreground"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerate(doc.type, doc.title)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 shrink-0"
                  >
                    <Sparkles size={13} /> {saved ? 'Regen' : 'Generate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Tab */}
      {activeTab === 'document' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-serif text-base font-semibold">{generatedTitle || 'Generated Document'}</h3>
            {generatedContent && !generating && (
              <button
                onClick={() => handleDownload(generatedContent, generatedTitle)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted"
              >
                <Download size={12} /> Export .md
              </button>
            )}
          </div>
          <div className="p-6">
            {generating ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">AI is crafting your investor document...</p>
              </div>
            ) : generatedContent ? (
              <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {generatedContent}
              </pre>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles size={28} className="mx-auto mb-3 text-amber-400" />
                <p className="text-sm">Generate a document from the AI Docs tab</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {loadingSaved ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : savedDocs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm bg-white rounded-2xl border border-dashed border-border">
              No saved documents yet. Generate documents from the AI Docs tab.
            </div>
          ) : (
            savedDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-serif text-sm font-semibold">{doc.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setGeneratedContent(doc.content); setGeneratedTitle(doc.title); setActiveTab('document'); }}
                      className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc.content, doc.title)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted"
                    >
                      <Download size={11} /> Export
                    </button>
                  </div>
                </div>
                <div className="px-5 py-3 max-h-24 overflow-hidden">
                  <p className="text-xs text-muted-foreground line-clamp-3">{doc.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
