import React, { useState, useEffect, useMemo } from 'react'

import { API } from '../config'

function getToken() { return localStorage.getItem('driftowl_token') || '' }

// ── Types ──────────────────────────────────────────────────────────────────

interface Pill {
  id: string
  problem_class: string
  abstract_pattern: string
  mechanism_name: string
  core_rules: string[]
  key_conditions: string[]
  why_it_works: string
  tags: string[]
  mode: string
  usage_count: number
  created_at: string
}

// ── Colours per problem class ──────────────────────────────────────────────

const CLASS_COLOR: Record<string, string> = {
  'Principal-Agent':    '#1C6EF3',
  'Coordination':       '#7C3AED',
  'Auction':            '#D97706',
  'Public Goods':       '#059669',
  'Signaling':          '#DC2626',
  'Reputation':         '#0891B2',
  'Voting':             '#BE185D',
  'Information Design': '#6D28D9',
  'Bargaining':         '#B45309',
  'Contract Design':    '#047857',
}

function classColor(c: string) { return CLASS_COLOR[c] || '#8A8A8E' }

// ── PillCard ──────────────────────────────────────────────────────────────

function PillCard({ pill, onUse }: { pill: Pill; onUse: (p: Pill) => void }) {
  const [expanded, setExpanded] = useState(false)
  const color = classColor(pill.problem_class)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
      onClick={() => setExpanded(x => !x)}
    >
      {/* Header */}
      <div style={{ padding: '20px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
            color, background: `${color}12`, padding: '3px 9px', borderRadius: 20,
          }}>{pill.problem_class}</span>
          <span style={{ fontSize: 11, color: '#AEAEB2' }}>
            {pill.usage_count > 0 ? `Used ${pill.usage_count}×` : 'New'}
          </span>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0A0A0F', margin: '0 0 8px', letterSpacing: -0.3 }}>
          {pill.mechanism_name}
        </h3>
        <p style={{ fontSize: 13, color: '#6B6B70', margin: 0, lineHeight: 1.5 }}>
          {pill.abstract_pattern}
        </p>
      </div>

      {/* Tags */}
      <div style={{ padding: '0 22px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {pill.tags.slice(0, 4).map(tag => (
          <span key={tag} style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 20,
            background: 'rgba(0,0,0,0.04)', color: '#6B6B70', fontWeight: 500,
          }}>{tag}</span>
        ))}
        {pill.tags.length > 4 && (
          <span style={{ fontSize: 11, color: '#AEAEB2', padding: '3px 0' }}>+{pill.tags.length - 4}</span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '20px 22px' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Core rules */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>
            Core rules
          </p>
          <ul style={{ margin: '0 0 18px', paddingLeft: 18 }}>
            {pill.core_rules.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.6, marginBottom: 4 }}>{r}</li>
            ))}
          </ul>

          {/* Conditions */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>
            Validity conditions
          </p>
          <ul style={{ margin: '0 0 18px', paddingLeft: 18 }}>
            {pill.key_conditions.map((c, i) => (
              <li key={i} style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.6, marginBottom: 4 }}>{c}</li>
            ))}
          </ul>

          {/* Why it works */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>
            Why it works
          </p>
          <p style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.6, margin: '0 0 20px' }}>
            {pill.why_it_works}
          </p>

          {/* CTA */}
          <button
            onClick={() => onUse(pill)}
            style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: color, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            Use as starting point →
          </button>
        </div>
      )}
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◎</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0F', marginBottom: 8 }}>
        Library is empty
      </h3>
      <p style={{ fontSize: 14, color: '#8A8A8E', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
        Complete your first analysis and the system will automatically distil the mechanism into a reusable pill.
      </p>
    </div>
  )
}

// ── Main LibraryPage ───────────────────────────────────────────────────────

const ALL_CLASSES = [
  'All', 'Principal-Agent', 'Coordination', 'Auction',
  'Public Goods', 'Signaling', 'Reputation', 'Voting',
  'Information Design', 'Bargaining', 'Contract Design',
]

export default function LibraryPage({
  onBack,
  onUsePill,
}: {
  onBack: () => void
  onUsePill: (pill: Pill) => void
}) {
  const [pills, setPills]           = useState<Pill[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activeClass, setActiveClass] = useState('All')

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('driftowl_user') || '{}') } catch { return {} }
  })()

  useEffect(() => {
    fetch(`${API}/pills`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPills(Array.isArray(data) ? data : []))
      .catch(() => setPills([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = pills
    if (activeClass !== 'All') list = list.filter(p => p.problem_class === activeClass)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.mechanism_name.toLowerCase().includes(q) ||
        p.abstract_pattern.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.problem_class.toLowerCase().includes(q)
      )
    }
    return list
  }, [pills, search, activeClass])

  const handleUsePill = async (pill: Pill) => {
    // Increment usage count
    try {
      await fetch(`${API}/pills/${pill.id}/use`, { method: 'POST' })
    } catch { /* silent */ }
    onUsePill(pill)
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F6F8FC' }}>

      {/* ── NAVBAR ── */}
      <div style={{
        padding: '0 40px', height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(246,248,252,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#8A8A8E', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
          }}>
            <span style={{ fontSize: 15 }}>←</span> Dashboard
          </button>
          <span style={{ color: 'rgba(0,0,0,0.12)', fontSize: 16 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#0A0A0F' }}>DriftOwl</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>{user?.first_name?.[0]?.toUpperCase() || '?'}</div>
          <span style={{ fontSize: 13, color: '#3C3C43', fontWeight: 500 }}>{user?.first_name || 'User'}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 4 }}>
                Mechanism Library
              </h1>
              <p style={{ fontSize: 14, color: '#8A8A8E' }}>
                {pills.length} distilled pattern{pills.length !== 1 ? 's' : ''} — abstract, reusable, ready to apply.
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: '#AEAEB2', pointerEvents: 'none',
              }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search mechanisms, tags…"
                style={{
                  padding: '8px 14px 8px 32px', borderRadius: 10, width: 240,
                  border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
                  fontSize: 13, color: '#0A0A0F', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Class filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {ALL_CLASSES.map(cls => {
              const count = cls === 'All' ? pills.length : pills.filter(p => p.problem_class === cls).length
              if (cls !== 'All' && count === 0) return null
              return (
                <button
                  key={cls}
                  onClick={() => setActiveClass(cls)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: activeClass === cls ? '#0A0A0F' : '#fff',
                    color: activeClass === cls ? '#fff' : '#6B6B70',
                    fontSize: 13, fontWeight: activeClass === cls ? 700 : 500,
                    border: activeClass === cls ? 'none' : '1px solid rgba(0,0,0,0.10)',
                  } as React.CSSProperties}
                >
                  {cls} {count > 0 && <span style={{ opacity: 0.6 }}>({count})</span>}
                </button>
              )
            })}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#AEAEB2', fontSize: 14 }}>
              Loading library…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {filtered.map(pill => (
                <PillCard key={pill.id} pill={pill} onUse={handleUsePill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
