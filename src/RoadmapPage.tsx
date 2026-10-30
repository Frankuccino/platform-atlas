import { useMemo, useState } from 'react';
import { PHASES, type Phase, type Status } from './roadmap';

const STATUS_META: Record<Status | 'all', { label: string; className: string }> = {
  done: { label: 'Shipped', className: 'pill-done' },
  'in-progress': { label: 'In progress', className: 'pill-progress' },
  planned: { label: 'Planned', className: 'pill-planned' },
  all: { label: 'All', className: 'pill-all' },
};

function PhaseSection({ phase, expanded, onToggle }: { phase: Phase; expanded: boolean; onToggle: () => void }) {
  const done = phase.milestones.filter((m) => m.status === 'done').length;
  const total = phase.milestones.length;
  const pct = Math.round((done / total) * 100);
  const overall = STATUS_META[phase.status];

  return (
    <section className={`phase phase-${phase.status}`}>
      <button type="button" className="phase-head" onClick={onToggle} aria-expanded={expanded}>
        <span className="phase-title">{phase.title}</span>
        <span className="phase-goal">{phase.goal}</span>
        <span className={`pill ${overall.className}`}>{overall.label}</span>
        <span className="phase-count">
          {done}/{total}
        </span>
        <span className="phase-bar">
          <span className="phase-bar-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="phase-chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <ul className="milestones">
          {phase.milestones.map((m) => {
            const meta = STATUS_META[m.status];
            return (
              <li key={m.id} className={`milestone milestone-${m.status}`}>
                <span className={`pill ${meta.className}`}>{meta.label}</span>
                <span className="milestone-title">{m.title}</span>
                <span className="milestone-detail">{m.detail}</span>
                {m.doc && (
                  <a className="milestone-doc" href={`/${m.doc}`} target="_blank" rel="noopener">
                    {m.doc}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function RoadmapPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [PHASES[0].id]: true,
    [PHASES[1].id]: true,
  });

  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  const phases = useMemo<Phase[]>(() => {
    if (statusFilter === 'all') return PHASES;
    return PHASES.map((p) => ({
      ...p,
      milestones: p.milestones.filter((m: { status: Status }) => m.status === statusFilter),
    })).filter((p: Phase) => p.milestones.length > 0);
  }, [statusFilter]);

  const counts = useMemo(() => {
    const c = { all: 0, done: 0, 'in-progress': 0, planned: 0 } as Record<string, number>;
    for (const p of PHASES)
      for (const m of p.milestones) {
        c.all++;
        c[m.status]++;
      }
    return c;
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="roadmap">
      <header className="roadmap-head">
        <h2>Project Roadmap</h2>
        <p className="roadmap-sub">
          Platform Atlas — what is shipped, what is in progress, and what comes next.
        </p>
        <div className="roadmap-filters">
          {(['all', 'done', 'in-progress', 'planned'] as const).map((s) => {
            const label = s === 'all' ? 'All' : STATUS_META[s].label;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                className={`pill-filter ${active ? 'pill-filter-active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {label}
                <span className="pill-filter-count">{counts[s]}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="roadmap-body">
        {phases.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            expanded={!!expanded[phase.id]}
            onToggle={() => toggle(phase.id)}
          />
        ))}
      </div>
    </div>
  );
}
