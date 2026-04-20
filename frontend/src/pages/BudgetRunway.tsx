// src/pages/BudgetRunway.tsx
import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { listItems, createItem, deleteItem, RESOURCES } from '@/lib/projectApi';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  Plus, Trash2, Loader2, CheckCircle2, X, Flame,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';


type FinancialEntry = {
  id: string;
  project_id: string;
  month: string; // format: YYYY-MM
  label?: string;
  type: "cost" | "revenue" | "projection" | string;
  category?: string;
  notes?: string;
  amount: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  salary:         'bg-purple-100 text-purple-700',
  infrastructure: 'bg-blue-100 text-blue-700',
  marketing:      'bg-pink-100 text-pink-700',
  operations:     'bg-amber-100 text-amber-700',
  other:          'bg-slate-100 text-slate-600',
};
const DEFAULT_THRESHOLD = 10000;

type EntryFormState = {
  project_id: string;
  month: string; // format: YYYY-MM
  label: string;
  type: "cost" | "revenue" | "projection";
  category: "salary" | "infrastructure" | "marketing" | "operations" | "other";
  amount: string; // stored as string while editing
  notes: string;
};

// ── Entry Form ────────────────────────────────────────────────────────────────
const EntryForm = ({
  projectId, onSave, onCancel,
}: {
  projectId: string; onSave: () => void; onCancel: () => void;
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [form, setForm] = useState<EntryFormState>({
    project_id: projectId,
    month: currentMonth,
    label: "",
    type: "cost",
    category: "operations",
    amount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof EntryFormState>(k: K, v: EntryFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await createItem(RESOURCES.FINANCIAL_ENTRIES, { ...form, amount: parseFloat(form.amount) });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
      <h3 className="font-serif text-base font-semibold">Add Financial Entry</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
          <input
            type="month"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={form.month}
            onChange={(e) => set("month", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
          <select
            className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={form.type}
            onChange={(e) => set("type", e.target.value as EntryFormState["type"])}
          >
            <option value="cost">Cost / Expense</option>
            <option value="revenue">Revenue / Income</option>
            <option value="projection">Projection</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Label</label>
          <input
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. Developer salary" value={form.label}
            onChange={(e) => set('label', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (USD)</label>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="0.00" value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </div>
      </div>
      {form.type === 'cost' && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {['salary', 'infrastructure', 'marketing', 'operations', 'other'].map((c) => (
              <button
                key={c}
                onClick={() => set('category', c as EntryFormState["category"])}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  form.category === (c as EntryFormState["category"])
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-muted">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!form.amount || !form.month || saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Save Entry
        </button>
      </div>
    </div>
  );
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
type TooltipPayloadItem = {
  color?: string;
  name?: string;
  value?: number | string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetRunway() {
  const { currentProject } = useProject();
  const [entries, setEntries]       = useState<FinancialEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [threshold, setThreshold]   = useState(DEFAULT_THRESHOLD);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput]     = useState<number>(DEFAULT_THRESHOLD);
  const [activeTab, setActiveTab]   = useState('overview');

  const loadEntries = useCallback(async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await listItems<FinancialEntry>(RESOURCES.FINANCIAL_ENTRIES, currentProject.id);
      setEntries([...data].sort((a, b) => (a.month || '').localeCompare(b.month || '')));
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentProject?.id) {
      setLoading(false);
      return;
    }
    loadEntries();
    const saved = localStorage.getItem(`threshold_${currentProject.id}`);
    if (saved) {
      setThreshold(parseFloat(saved));
      setThresholdInput(parseFloat(saved));
    }
  }, [currentProject?.id, loadEntries]);

  const handleDelete = async (id: string) => {
    await deleteItem(RESOURCES.FINANCIAL_ENTRIES, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const saveThreshold = () => {
    const val = parseFloat(String(thresholdInput)) || DEFAULT_THRESHOLD;
    setThreshold(val);
    if (currentProject?.id) localStorage.setItem(`threshold_${currentProject.id}`, String(val));
    setEditingThreshold(false);
  };

  if (!currentProject) return <div className="text-muted-foreground text-sm">No project selected.</div>;

  // ── Monthly aggregates ────────────────────────────────────────────────────
  const months = [...new Set(entries.map((e) => e.month))].sort();
  const chartData = months.map((month) => {
    const me       = entries.filter((e) => e.month === month);
    const costs    = me.filter((e) => e.type === 'cost').reduce((s, e) => s + Number(e.amount || 0), 0);
    const revenue  = me.filter((e) => e.type === 'revenue').reduce((s, e) => s + Number(e.amount || 0), 0);
    const projection = me.filter((e) => e.type === 'projection').reduce((s, e) => s + Number(e.amount || 0), 0);
    const burnRate = Math.max(0, costs - revenue);
    const label    = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { month, label, costs, revenue, projection, burnRate, netFlow: revenue - costs };
  });

  const latestMonth  = chartData[chartData.length - 1];
  const avgBurnRate  = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.burnRate, 0) / chartData.length)
    : 0;
  const totalCosts   = entries.filter((e) => e.type === 'cost').reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalRevenue = entries.filter((e) => e.type === 'revenue').reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthlyBudget      = currentProject.budget_total || 0;
  const currentMonthCosts  = latestMonth?.costs || 0;
  const runway = avgBurnRate > 0 && monthlyBudget > 0 ? Math.floor(monthlyBudget / avgBurnRate) : null;

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts: { type: string; msg: string }[] = [];
  if (latestMonth?.burnRate > threshold)
    alerts.push({ type: 'error', msg: `This month's burn rate ($${latestMonth.burnRate.toLocaleString()}) exceeds your threshold ($${threshold.toLocaleString()})` });
  if (runway !== null && runway <= 3)
    alerts.push({ type: 'error', msg: `Critical: Only ${runway} month${runway === 1 ? '' : 's'} of runway remaining!` });
  else if (runway !== null && runway <= 6)
    alerts.push({ type: 'warning', msg: `Caution: ${runway} months of runway left — consider fundraising or reducing costs` });

  // ── Category breakdown ────────────────────────────────────────────────────
  const categoryTotals: Record<string, number> = {};
  entries.filter((e) => e.type === 'cost').forEach((e) => {
    const cat = e.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const runwayColor = runway === null ? 'text-muted-foreground'
    : runway <= 3 ? 'text-red-600' : runway <= 6 ? 'text-amber-600' : 'text-green-600';
  const runwayBg = runway === null ? 'from-slate-50 to-slate-100 border-border'
    : runway <= 3 ? 'from-red-50 to-red-100 border-red-200'
    : runway <= 6 ? 'from-amber-50 to-orange-50 border-amber-200'
    : 'from-green-50 to-emerald-50 border-green-200';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Budget & Runway</h2>
          <p className="text-muted-foreground text-sm mt-1">Track financials, burn rate, and projected runway</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90"
        >
          <Plus size={14} /> Add Entry
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                a.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertTriangle size={16} className="shrink-0" />
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EntryForm
          projectId={currentProject.id}
          onSave={() => { setShowForm(false); loadEntries(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 shadow-sm bg-gradient-to-br ${runwayBg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className={runwayColor} />
            <span className="text-xs font-medium text-muted-foreground">Runway</span>
          </div>
          <div className={`text-3xl font-bold ${runwayColor}`}>{runway !== null ? runway : '—'}</div>
          <div className="text-xs text-muted-foreground mt-1">{runway !== null ? 'months remaining' : 'set budget total'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Avg Burn Rate</span>
          </div>
          <div className="text-3xl font-bold text-foreground">${avgBurnRate.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">per month</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Total Costs</span>
          </div>
          <div className="text-3xl font-bold text-foreground">${totalCosts.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">all time</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">all time</div>
        </div>
      </div>

      {/* Monthly budget bar */}
      {monthlyBudget > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">This Month's Spend vs Budget</span>
            <span className="text-sm font-semibold">${currentMonthCosts.toLocaleString()} / ${monthlyBudget.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                currentMonthCosts / monthlyBudget > 0.85 ? 'bg-red-500'
                : currentMonthCosts / monthlyBudget > 0.6 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (currentMonthCosts / monthlyBudget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{Math.round((currentMonthCosts / monthlyBudget) * 100)}% of budget used</span>
            <span>${Math.max(0, monthlyBudget - currentMonthCosts).toLocaleString()} remaining</span>
          </div>
        </div>
      )}

      {/* Threshold Setting */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Monthly Expense Threshold</div>
          <div className="text-xs text-muted-foreground mt-0.5">Alert when monthly burn exceeds this amount</div>
        </div>
        {editingThreshold ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              type="number"
              className="w-28 px-3 py-1.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(parseFloat(e.target.value))}
            />
            <button
              onClick={saveThreshold}
              className="flex items-center gap-1 px-3 py-1.5 bg-foreground text-background rounded-xl text-sm"
            >
              <CheckCircle2 size={13} /> Save
            </button>
            <button onClick={() => setEditingThreshold(false)} className="p-1.5 rounded-xl border border-border hover:bg-muted">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-amber-600">${threshold.toLocaleString()}</span>
            <button
              onClick={() => setEditingThreshold(true)}
              className="px-3 py-1.5 text-xs border border-border rounded-xl hover:bg-muted"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {['overview', 'entries'].map((t) => (
          <button
            key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'overview' ? 'Charts & Overview' : `All Entries (${entries.length})`}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-serif text-base font-semibold mb-5">Burn Rate & Revenue</h3>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <DollarSign size={28} className="mb-3 opacity-40" />
                Add financial entries to see your burn rate chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,10%,92%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine
                    y={threshold} stroke="hsl(0,72%,51%)" strokeDasharray="6 3"
                    label={{ value: 'Threshold', position: 'right', fontSize: 10, fill: 'hsl(0,72%,51%)' }}
                  />
                  <Bar dataKey="costs"   name="Costs"   fill="hsl(0,72%,51%)"   fillOpacity={0.75} radius={[4,4,0,0]} />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(142,71%,45%)" fillOpacity={0.75} radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="burnRate" name="Net Burn" stroke="hsl(38,92%,50%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(38,92%,50%)' }} />
                  {chartData.some((d) => d.projection > 0) && (
                    <Line type="monotone" dataKey="projection" name="Projection" stroke="hsl(220,25%,50%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-serif text-base font-semibold mb-4">Cost Breakdown by Category</h3>
              <div className="space-y-3">
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, total]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[cat] || 'bg-muted text-muted-foreground'}`}>
                          {cat}
                        </span>
                        <span className="text-sm font-semibold">${total.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                          style={{ width: `${(total / totalCosts) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {Math.round((total / totalCosts) * 100)}% of total costs
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
            <DollarSign size={28} className="mb-3 opacity-40" />
            No entries yet. Add your first financial entry above.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Month</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Label</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(e.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.label || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.type === 'revenue'    ? 'bg-green-100 text-green-700' :
                        e.type === 'projection' ? 'bg-blue-100 text-blue-700'  : 'bg-red-100 text-red-700'
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[e.category] || 'bg-muted text-muted-foreground'}`}>
                          {e.category}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      e.type === 'revenue' ? 'text-green-600' : e.type === 'projection' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {e.type === 'revenue' ? '+' : e.type === 'cost' ? '-' : ''}${Number(e.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
