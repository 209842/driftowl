import React, { useState, useEffect, useRef } from 'react'
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

const STATUS_COLOR: Record<string, string> = {
  in_progress:         '#F59E0B',
  synthesis_complete:  '#1C6EF3',
  simulation_complete: '#8B5CF6',
  completed:           '#10B981',
}

const STATUS_LABEL: Record<string, string> = {
  in_progress:         'In progress',
  synthesis_complete:  'Design complete',
  simulation_complete: 'Tested',
  completed:           'Completed',
}

const MODE_ICON: Record<string, string> = {
  company: '🏢', startup: '🚀', platform: '🌐', supplychain: '🔗',
  dao: '⬡', community: '🏘️', government: '🏛️', environment: '🌱',
  education: '🎓', healthcare: '🏥', media: '📱', sports: '🏆',
}

export default function ModeSelector({
  onStart, onBack, onSettings, onLibrary, onOpenAnalysis, suggestedPill, onClearPill,
}: {
  onStart: (context: string, problem: string) => void
  onBack?: () => void
  onSettings?: () => void
  onLibrary?: () => void
  onOpenAnalysis?: (id: string) => void
  suggestedPill?: any
  onClearPill?: () => void
}) {
  const [context, setContext]         = useState('')
  const [problem, setProblem]         = useState('')
  const [analyses, setAnalyses]       = useState<Analysis[]>([])
  const [loadingA, setLoadingA]       = useState(true)
  const [contextFocused, setContextFocused] = useState(false)
  const [problemFocused, setProblemFocused] = useState(false)
  const contextRef = useRef<HTMLTextAreaElement>(null)

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('driftowl_user') || '{}') } catch { return {} }
  })()
  const firstName = user?.first_name || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const token = localStorage.getItem('driftowl_token')
    if (!token) { setLoadingA(false); return }
    fetch(`${API}/analyses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoadingA(false))
  }, [])

  const canStart = context.trim().length >= 20 && problem.trim().length >= 20

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <div style={{
        padding: '0 32px', height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(246,248,252,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#0A0A0F' }}>DriftOwl</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={onLibrary} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '5px 12px', borderRadius: 7,
            fontSize: 13, fontWeight: 500, color: '#6E6E73',
          }}>Library</button>
          <button
            onClick={onSettings}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 9,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
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
              fontSize: 12, color: '#8A8A8E', cursor: 'pointer',
            }}>Log out</button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 60px' }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>

          {/* Greeting */}
          <div style={{ paddingTop: '7vh', marginBottom: 28, textAlign: 'center' }}>
            <h1 style={{
              fontSize: 30, fontWeight: 800, letterSpacing: -0.8,
              color: '#0A0A0F', margin: 0,
            }}>
              {greeting}, {firstName} 👋
            </h1>
            <p style={{ fontSize: 14, color: '#8A8A8E', marginTop: 8, marginBottom: 0 }}>
              Describe your system — the AI will design the optimal incentive mechanism
            </p>
          </div>

          {/* Pill banner */}
          {suggestedPill && (
            <div style={{
              marginBottom: 14,
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(28,110,243,0.07), rgba(79,70,229,0.07))',
              border: '1.5px solid rgba(28,110,243,0.18)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#1C6EF3', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Starting from library pill
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#0A0A0F' }}>
                  {suggestedPill.mechanism_name}
                </p>
              </div>
              <button onClick={onClearPill} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: '#AEAEB2', padding: '4px',
              }}>×</button>
            </div>
          )}

          {/* Input card */}
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 20,
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Context field */}
            <div style={{
              padding: '18px 22px 14px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              transition: 'background 0.15s',
              background: contextFocused ? 'rgba(28,110,243,0.02)' : 'transparent',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: contextFocused ? '#1C6EF3' : '#AEAEB2',
                textTransform: 'uppercase', marginBottom: 8,
                transition: 'color 0.15s',
              }}>Context</div>
              <textarea
                ref={contextRef}
                value={context}
                onChange={e => setContext(e.target.value)}
                onFocus={() => setContextFocused(true)}
                onBlur={() => setContextFocused(false)}
                placeholder="Describe your organization, team, platform, or system..."
                rows={3}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 15, color: '#0A0A0F', resize: 'none', fontFamily: 'inherit',
                  letterSpacing: -0.2, lineHeight: 1.6,
                }}
              />
            </div>

            {/* Problem field */}
            <div style={{
              padding: '14px 22px 18px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              transition: 'background 0.15s',
              background: problemFocused ? 'rgba(28,110,243,0.02)' : 'transparent',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: problemFocused ? '#1C6EF3' : '#AEAEB2',
                textTransform: 'uppercase', marginBottom: 8,
                transition: 'color 0.15s',
              }}>Problem</div>
              <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                onFocus={() => setProblemFocused(true)}
                onBlur={() => setProblemFocused(false)}
                placeholder="What behavior do you want to change? What outcome are you looking for?"
                rows={3}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 15, color: '#0A0A0F', resize: 'none', fontFamily: 'inherit',
                  letterSpacing: -0.2, lineHeight: 1.6,
                }}
              />
            </div>

            {/* Launch row */}
            <div style={{
              padding: '14px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.01)',
            }}>
              <span style={{
                fontSize: 12, color: canStart ? '#34C759' : '#AEAEB2',
                transition: 'color 0.2s',
              }}>
                {canStart ? '✓ Ready to launch' : `${Math.max(0, 20 - context.trim().length)} + ${Math.max(0, 20 - problem.trim().length)} chars left`}
              </span>
              <button
                onClick={() => canStart && onStart(context, problem)}
                disabled={!canStart}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: canStart
                    ? 'linear-gradient(135deg, #1C6EF3 0%, #4F46E5 100%)'
                    : 'rgba(0,0,0,0.07)',
                  color: canStart ? '#fff' : '#AEAEB2',
                  fontSize: 14, fontWeight: 700,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  letterSpacing: -0.2,
                  transition: 'all 0.2s ease',
                  boxShadow: canStart ? '0 4px 14px rgba(28,110,243,0.25)' : 'none',
                }}
                onMouseEnter={e => { if (canStart) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                Launch Analysis →
              </button>
            </div>
          </div>

          {/* ── RECENT ANALYSES ── */}
          <div style={{ marginTop: 48 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                color: '#AEAEB2', textTransform: 'uppercase',
              }}>Recent analyses</span>
              {analyses.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#AEAEB2',
                  background: 'rgba(0,0,0,0.05)', borderRadius: 100, padding: '2px 8px',
                }}>{analyses.length}</span>
              )}
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
            </div>

            {loadingA ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#AEAEB2', fontSize: 13 }}>Loading…</div>
            ) : analyses.length === 0 ? (
              <div style={{
                borderRadius: 14, border: '1px dashed rgba(0,0,0,0.10)',
                padding: '28px', textAlign: 'center',
                background: 'rgba(255,255,255,0.35)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73', marginBottom: 3 }}>No analyses yet</div>
                <div style={{ fontSize: 12, color: '#AEAEB2' }}>They will appear here after your first session</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analyses.map(a => {
                  const icon = MODE_ICON[a.mode] || '📊'
                  const statusColor = STATUS_COLOR[a.status] || '#AEAEB2'
                  const statusLabel = STATUS_LABEL[a.status] || a.status
                  const dateStr = new Date(a.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })
                  return (
                    <div key={a.id}
                      onClick={() => onOpenAnalysis?.(a.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.70)',
                        border: '1px solid rgba(0,0,0,0.07)',
                        cursor: onOpenAnalysis ? 'pointer' : 'default',
                        transition: 'background 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#fff'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.70)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: 'rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                      }}>{icon}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: '#0A0A0F',
                          marginBottom: 2, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {a.title || a.problem || 'Analysis in progress…'}
                        </div>
                        <div style={{
                          fontSize: 12, color: '#8A8A8E',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {a.context}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px',
                          borderRadius: 100, background: `${statusColor}15`, color: statusColor,
                        }}>{statusLabel}</span>
                        <span style={{ fontSize: 11, color: '#AEAEB2' }}>{dateStr}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
