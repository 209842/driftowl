import React, { useState, useMemo, useEffect } from 'react'
import { Mode } from '../types'

const API = 'http://localhost:8000'

interface Analysis {
  id: string
  mode: Mode
  title: string | null
  context: string
  problem: string
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  in_progress:         'In progress',
  synthesis_complete:  'Design complete',
  simulation_complete: 'Tested',
  completed:           'Completed',
}

const STATUS_COLOR: Record<string, string> = {
  in_progress:         '#F59E0B',
  synthesis_complete:  '#1C6EF3',
  simulation_complete: '#8B5CF6',
  completed:           '#10B981',
}

interface ModeConfig {
  id: Mode
  label: string
  sub: string
  desc: string
  tags: string[]
  color: string
  bg: string
  icon: string
  section: string
}

const ALL_MODES: ModeConfig[] = [
  // ── IMPRESE & MERCATI ──
  {
    id: 'company', section: 'Business & Markets',
    label: 'Company', sub: 'Teams & incentives', icon: '🏢',
    color: '#1C6EF3', bg: 'rgba(28,110,243,0.06)',
    desc: 'Align salespeople, managers and employees. Solve free-riding, internal competition and miscalibrated incentive structures.',
    tags: ['Nash Equilibrium', 'Principal-Agent', 'Behavioural'],
  },
  {
    id: 'startup', section: 'Business & Markets',
    label: 'Startup', sub: 'Equity & co-founder dynamics', icon: '🚀',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',
    desc: 'Design cap tables, vesting schedules and founder-investor contracts that hold up against long-run perverse incentives.',
    tags: ['Vesting Design', 'VC Alignment', 'Contract Theory'],
  },
  {
    id: 'platform', section: 'Business & Markets',
    label: 'Platform', sub: 'Digital ecosystems', icon: '🌐',
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)',
    desc: 'Build the rules of two-sided marketplaces and social networks. Manage content quality, pricing and reputation systems.',
    tags: ['Two-sided Markets', 'Reputation', 'Network Effects'],
  },
  {
    id: 'supplychain', section: 'Business & Markets',
    label: 'Supply Chain', sub: 'Vendors & procurement', icon: '🔗',
    color: '#EC4899', bg: 'rgba(236,72,153,0.06)',
    desc: 'Solve hold-up problems, double marginalization, and design optimal procurement auctions between buyers and suppliers.',
    tags: ['Procurement Auction', 'Transaction Costs', 'Bullwhip'],
  },

  // ── GOVERNANCE ──
  {
    id: 'dao', section: 'Governance',
    label: 'DAO', sub: 'Decentralized governance', icon: '⬡',
    color: '#06B6D4', bg: 'rgba(6,182,212,0.06)',
    desc: 'Design quadratic voting, treasury allocation and governance systems resistant to whale manipulation and voter apathy.',
    tags: ['Quadratic Voting', 'Token Economics', 'Coordination'],
  },
  {
    id: 'community', section: 'Governance',
    label: 'Community', sub: 'Commons & collective governance', icon: '🏘️',
    color: '#10B981', bg: 'rgba(16,185,129,0.06)',
    desc: "Apply Ostrom's 8 principles. Design governance for HOAs, cooperatives and local commons that sustain over time.",
    tags: ["Ostrom's Rules", 'Social Capital', 'Collective Action'],
  },
  {
    id: 'government', section: 'Governance',
    label: 'Government', sub: 'Policy & public goods', icon: '🏛️',
    color: '#64748B', bg: 'rgba(100,116,139,0.06)',
    desc: 'Analyze public policy, subsidies, Pigouvian taxes and auction mechanisms through the lens of game theory.',
    tags: ['Public Goods', 'Pigouvian Tax', 'Implementation Theory'],
  },
  {
    id: 'environment', section: 'Governance',
    label: 'Environment', sub: 'Green markets & externalities', icon: '🌱',
    color: '#22C55E', bg: 'rgba(34,197,94,0.06)',
    desc: 'Design carbon markets, emissions trading and international cooperation mechanisms for global public goods.',
    tags: ['Carbon Pricing', 'Cap & Trade', 'International Cooperation'],
  },

  // ── SECTORS ──
  {
    id: 'education', section: 'Sectors',
    label: 'Education', sub: 'Learning systems', icon: '🎓',
    color: '#EF4444', bg: 'rgba(239,68,68,0.06)',
    desc: 'Design assessments and incentives that maximize genuine learning rather than surface-level performance and grade gaming.',
    tags: ['Intrinsic Motivation', 'Signaling', 'Human Capital'],
  },
  {
    id: 'healthcare', section: 'Sectors',
    label: 'Healthcare', sub: 'Health systems', icon: '🏥',
    color: '#F97316', bg: 'rgba(249,115,22,0.06)',
    desc: 'Solve insurance moral hazard, align physician incentives with patient outcomes, and design fair healthcare markets.',
    tags: ['Moral Hazard', 'Adverse Selection', 'Value-Based Care'],
  },
  {
    id: 'media', section: 'Sectors',
    label: 'Media & Creator', sub: 'The attention economy', icon: '📱',
    color: '#A855F7', bg: 'rgba(168,85,247,0.06)',
    desc: 'Design recommendation algorithms, creator economy rules and moderation systems that align quality with engagement.',
    tags: ['Attention Economy', 'Two-sided Market', 'Creator Incentives'],
  },
  {
    id: 'sports', section: 'Sectors',
    label: 'Sports', sub: 'Competition & tournament design', icon: '🏆',
    color: '#D97706', bg: 'rgba(217,119,6,0.06)',
    desc: 'Design tournaments, salary caps, drafts and league structures that maximize competitive balance and spectacle.',
    tags: ['Tournament Theory', 'Superstar Economics', 'Competitive Balance'],
  },
]

const SECTIONS = ['Business & Markets', 'Governance', 'Sectors']

export default function ModeSelector({ onSelect, onBack, onSettings, onLibrary, onOpenAnalysis }: {
  onSelect: (m: Mode) => void
  onBack?: () => void
  onSettings?: () => void
  onLibrary?: () => void
  onOpenAnalysis?: (id: string) => void
}) {
  const [hovered, setHovered]           = useState<Mode | null>(null)
  const [search, setSearch]             = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [analyses, setAnalyses]         = useState<Analysis[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('driftowl_user') || '{}') } catch { return {} }
  })()
  const firstName = user?.first_name || 'User'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const token = localStorage.getItem('driftowl_token')
    if (!token) { setLoadingAnalyses(false); return }
    fetch(`${API}/analyses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoadingAnalyses(false))
  }, [])

  const filtered = useMemo(() => {
    let list = ALL_MODES
    if (activeSection) list = list.filter(m => m.section === activeSection)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.label.toLowerCase().includes(q) ||
        m.sub.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [search, activeSection])

  const grouped = useMemo(() => {
    const sections: Record<string, ModeConfig[]> = {}
    for (const m of filtered) {
      if (!sections[m.section]) sections[m.section] = []
      sections[m.section].push(m)
    }
    return sections
  }, [filtered])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <div style={{
        padding: '0 40px', height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(246,248,252,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#0A0A0F' }}>DriftOwl</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {[
              { label: 'Dashboard', action: undefined },
              { label: 'Library', action: onLibrary },
            ].map(({ label, action }, i) => (
              <button key={label} onClick={action} style={{
                background: i === 0 ? 'rgba(0,0,0,0.05)' : 'none',
                border: 'none', cursor: action ? 'pointer' : 'default',
                padding: '5px 12px', borderRadius: 7,
                fontSize: 13, fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? '#0A0A0F' : '#8A8A8E',
              } as React.CSSProperties}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onSettings}
            title="Account settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: onSettings ? 'pointer' : 'default',
              padding: '4px 8px', borderRadius: 9,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (onSettings) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>{firstName[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13, color: '#3C3C43', fontWeight: 500 }}>{firstName}</span>
          </button>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 7, padding: '4px 12px',
              fontSize: 12, color: '#8A8A8E', cursor: 'pointer', marginLeft: 2,
            }}>Log out</button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 56px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 4 }}>
                {greeting}, {firstName} <img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44b.png" alt="👋" style={{ width: 28, height: 28, verticalAlign: 'middle', marginLeft: 2, display: 'inline-block' }} />
              </h1>
              <p style={{ fontSize: 14, color: '#8A8A8E' }}>
                Select your system type — {ALL_MODES.length} contexts available, 8 specialized agents each.
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: '#AEAEB2', pointerEvents: 'none',
              }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search context or concept..."
                style={{
                  padding: '9px 16px 9px 36px', borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.10)',
                  background: 'rgba(255,255,255,0.85)',
                  fontSize: 13, color: '#0A0A0F', outline: 'none',
                  width: 260, fontFamily: 'inherit',
                  backdropFilter: 'blur(12px)',
                }}
              />
            </div>
          </div>

          {/* Section filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <button
              onClick={() => setActiveSection(null)}
              style={{
                padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: 'none',
                background: activeSection === null ? '#0A0A0F' : 'rgba(255,255,255,0.75)',
                color: activeSection === null ? '#fff' : '#6E6E73',
                border: activeSection === null ? 'none' : '1px solid rgba(0,0,0,0.08)',
                transition: 'all 0.15s ease',
              } as React.CSSProperties}
            >All ({ALL_MODES.length})</button>
            {SECTIONS.map(s => {
              const count = ALL_MODES.filter(m => m.section === s).length
              const active = activeSection === s
              return (
                <button key={s} onClick={() => setActiveSection(active ? null : s)} style={{
                  padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  background: active ? '#0A0A0F' : 'rgba(255,255,255,0.75)',
                  color: active ? '#fff' : '#6E6E73',
                  border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.15s ease',
                } as React.CSSProperties}>
                  {s} ({count})
                </button>
              )
            })}
          </div>

          {/* Grouped cards */}
          {Object.entries(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#AEAEB2' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#6E6E73' }}>No results</div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          ) : Object.entries(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#AEAEB2' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#6E6E73' }}>No results</div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          ) : (
            Object.entries(grouped).map(([section, modes]) => (
              <div key={section} style={{ marginBottom: 40 }}>
                {/* Section header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    color: '#AEAEB2', textTransform: 'uppercase',
                  }}>{section}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                </div>

                {/* Cards grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 12,
                }}>
                  {modes.map(m => {
                    const isHov = hovered === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        onMouseEnter={() => setHovered(m.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          borderRadius: 16, padding: '20px 22px',
                          background: isHov ? '#fff' : 'rgba(255,255,255,0.65)',
                          border: isHov ? `1.5px solid ${m.color}28` : '1px solid rgba(0,0,0,0.07)',
                          cursor: 'pointer',
                          transition: 'all 0.16s cubic-bezier(0.4,0,0.2,1)',
                          transform: isHov ? 'translateY(-2px)' : 'none',
                          boxShadow: isHov ? `0 6px 24px ${m.color}14` : 'none',
                          display: 'flex', flexDirection: 'column', gap: 10,
                        }}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                              color: m.color, textTransform: 'uppercase', marginBottom: 3,
                            }}>{m.sub}</div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: '#0A0A0F', letterSpacing: -0.4 }}>
                              {m.label}
                            </div>
                          </div>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: m.bg, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 17,
                            transition: 'transform 0.16s ease',
                            transform: isHov ? 'scale(1.12)' : 'scale(1)',
                          }}>{m.icon}</div>
                        </div>

                        {/* Description */}
                        <p style={{
                          fontSize: 13, color: '#6E6E73', lineHeight: 1.6, margin: 0,
                        }}>{m.desc}</p>

                        {/* Tags + arrow */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {m.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                borderRadius: 100, background: m.bg,
                                color: m.color, letterSpacing: 0.2,
                              }}>{tag}</span>
                            ))}
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 700, color: m.color,
                            opacity: isHov ? 1 : 0, transition: 'opacity 0.16s',
                            flexShrink: 0,
                          }}>→</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {/* Recent analyses */}
          {!search && !activeSection && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 8,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                  color: '#AEAEB2', textTransform: 'uppercase',
                }}>Recent analyses</span>
                {analyses.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#AEAEB2',
                    background: 'rgba(0,0,0,0.05)', borderRadius: 100,
                    padding: '2px 8px',
                  }}>{analyses.length}</span>
                )}
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
              </div>

              {loadingAnalyses ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#AEAEB2' }}>Loading…</div>
                </div>
              ) : analyses.length === 0 ? (
                <div style={{
                  borderRadius: 14, border: '1px dashed rgba(0,0,0,0.10)',
                  padding: '28px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.35)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73', marginBottom: 3 }}>
                    No analyses yet
                  </div>
                  <div style={{ fontSize: 12, color: '#AEAEB2' }}>
                    They will appear here after your first session
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analyses.map(a => {
                    const modeConfig = ALL_MODES.find(m => m.id === a.mode)
                    const statusColor = STATUS_COLOR[a.status] || '#AEAEB2'
                    const statusLabel = STATUS_LABEL[a.status] || a.status
                    const date = new Date(a.created_at)
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    return (
                      <div key={a.id}
                        onClick={() => onOpenAnalysis?.(a.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '14px 18px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.70)',
                          border: '1px solid rgba(0,0,0,0.07)',
                          cursor: onOpenAnalysis ? 'pointer' : 'default',
                          transition: 'background 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.70)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      >
                        {/* Mode icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: modeConfig?.bg || 'rgba(0,0,0,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 17,
                        }}>
                          {modeConfig?.icon || '📊'}
                        </div>

                        {/* Title + problem */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 700, color: '#0A0A0F',
                            marginBottom: 2, whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {a.title || 'Analysis in progress…'}
                          </div>
                          <div style={{
                            fontSize: 12, color: '#8A8A8E',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {a.problem}
                          </div>
                        </div>

                        {/* Meta */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px',
                            borderRadius: 100, background: `${statusColor}15`,
                            color: statusColor,
                          }}>{statusLabel}</span>
                          <span style={{ fontSize: 11, color: '#AEAEB2' }}>{dateStr}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
