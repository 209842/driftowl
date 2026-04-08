import React, { useState, useEffect, useRef } from 'react'
import { Persona, AgentAction, RoundSummary, SimulationComplete, SynthesisData } from '../types'

interface Props {
  sessionId: string
  synthesis: SynthesisData
  onComplete: (results: number[]) => void
  onGeneratePaper: () => void
}

export default function SimulationPhase({ sessionId, synthesis, onComplete, onGeneratePaper }: Props) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([])
  const [actions, setActions] = useState<AgentAction[]>([])
  const [simComplete, setSimComplete] = useState<SimulationComplete | null>(null)
  const [status, setStatus] = useState('Initializing...')
  const [started, setStarted] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [actions.length, roundSummaries.length])

  const startSimulation = async () => {
    setStarted(true)
    await fetch(`http://localhost:8000/session/${sessionId}/simulate`, { method: 'POST' })

    const es = new EventSource(`http://localhost:8000/session/${sessionId}/simulate/stream`)

    es.addEventListener('status', e => setStatus(JSON.parse(e.data).message))

    es.addEventListener('persona', e => {
      setPersonas(prev => [...prev, JSON.parse(e.data)])
    })

    es.addEventListener('round_start', e => {
      const data = JSON.parse(e.data)
      setCurrentRound(data.round)
      setStatus(`Round ${data.round} of ${data.total} — agents deciding...`)
    })

    es.addEventListener('agent_action', e => {
      setActions(prev => [...prev, JSON.parse(e.data)])
    })

    es.addEventListener('round_end', e => {
      setRoundSummaries(prev => [...prev, JSON.parse(e.data)])
    })

    es.addEventListener('simulation_complete', e => {
      const data: SimulationComplete = JSON.parse(e.data)
      setSimComplete(data)
      onComplete(data.rounds_data)
    })

    es.addEventListener('done', () => {
      setStatus('Simulation complete')
      es.close()
    })

    es.onerror = () => es.close()
  }

  // Group actions by round
  const actionsByRound: Record<number, AgentAction[]> = {}
  actions.forEach(a => {
    if (!actionsByRound[a.round]) actionsByRound[a.round] = []
    actionsByRound[a.round].push(a)
  })

  if (!started) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40
      }}>
        <div style={{ fontSize: 48 }}>🧪</div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0F', marginBottom: 8 }}>
            Test in Virtual Society
          </h2>
          <p style={{ fontSize: 15, color: '#8A8A8E', maxWidth: 420, lineHeight: 1.6 }}>
            We'll create a virtual population from your context and simulate how they respond to <strong style={{ color: '#0A0A0F' }}>{synthesis.mechanism_name}</strong> over 7 rounds.
          </p>
        </div>
        <button
          onClick={startSimulation}
          style={{
            padding: '14px 32px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
            color: '#fff', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', letterSpacing: -0.2
          }}
        >
          Run Simulation →
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Status bar */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!simComplete && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1s infinite' }} />
          )}
          {simComplete && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954' }} />
          )}
          <span style={{ fontSize: 13, color: '#8A8A8E' }}>{status}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {personas.length > 0 && (
            <span style={{ fontSize: 12, color: '#8A8A8E' }}>{personas.length} agents</span>
          )}
          {currentRound > 0 && (
            <span style={{ fontSize: 12, color: '#8A8A8E' }}>Round {currentRound}/7</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(0,0,0,0.04)', flexShrink: 0 }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, #1C6EF3, #4F46E5)',
          width: `${(currentRound / 7) * 100}%`,
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: round chart */}
        <div style={{ flex: '0 0 45%', padding: 20, borderRight: '1px solid rgba(0,0,0,0.05)', overflowY: 'auto' }}>
          {/* Compliance chart */}
          {roundSummaries.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8A8E', letterSpacing: 1, marginBottom: 12 }}>
                COMPLIANCE BY ROUND
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                {roundSummaries.map(r => (
                  <div key={r.round} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%',
                      height: `${r.comply_rate * 70}px`,
                      background: r.comply_rate > 0.6
                        ? 'rgba(29,185,84,0.3)'
                        : r.comply_rate > 0.3
                        ? 'rgba(245,158,11,0.3)'
                        : 'rgba(239,68,68,0.3)',
                      border: `1px solid ${r.comply_rate > 0.6 ? 'rgba(29,185,84,0.5)' : r.comply_rate > 0.3 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}`,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'height 0.3s ease'
                    }} />
                    <span style={{ fontSize: 10, color: '#8A8A8E' }}>R{r.round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final stats */}
          {simComplete && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Final', value: `${(simComplete.final_comply_rate * 100).toFixed(0)}%`, color: '#1C6EF3' },
                { label: 'Peak', value: `${(simComplete.peak_comply_rate * 100).toFixed(0)}%`, color: '#1DB954' },
                { label: 'Trend', value: simComplete.trend === 'improving' ? '↑' : simComplete.trend === 'declining' ? '↓' : '→', color: simComplete.trend === 'improving' ? '#1DB954' : simComplete.trend === 'declining' ? '#EF4444' : '#8A8A8E' }
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#8A8A8E', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Personas grid */}
          {personas.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8A8E', letterSpacing: 1, marginBottom: 10 }}>
                POPULATION ({personas.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {personas.map(p => {
                  const lastAction = [...actions].reverse().find(a => a.id === p.id)
                  const isComplying = lastAction?.decision === 'COMPLY'
                  const hasActed = !!lastAction
                  return (
                    <div key={p.id} title={`${p.name} — ${p.role}\n${p.personality}`} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: hasActed
                        ? isComplying ? 'rgba(29,185,84,0.15)' : 'rgba(239,68,68,0.1)'
                        : 'rgba(0,0,0,0.04)',
                      border: `1.5px solid ${hasActed ? isComplying ? 'rgba(29,185,84,0.4)' : 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                      color: hasActed ? isComplying ? '#1DB954' : '#EF4444' : '#8A8A8E',
                      transition: 'all 0.3s ease', cursor: 'default'
                    }}>
                      {p.name.charAt(0)}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Generate paper button */}
          {simComplete && (
            <button
              onClick={onGeneratePaper}
              style={{
                width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #0A0A0F, #1C1C3E)',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', letterSpacing: -0.2
              }}
            >
              📄 Generate Research Paper →
            </button>
          )}
        </div>

        {/* Right: action feed */}
        <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px' }}>
          {Object.entries(actionsByRound).map(([round, roundActions]) => {
            const summary = roundSummaries.find(r => r.round === parseInt(round))
            return (
              <div key={round} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
                }}>
                  <div style={{
                    height: 1, flex: 1, background: 'rgba(0,0,0,0.06)'
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#8A8A8E',
                    letterSpacing: 1, whiteSpace: 'nowrap'
                  }}>
                    ROUND {round}
                    {summary && ` · ${(summary.comply_rate * 100).toFixed(0)}% compliance`}
                  </span>
                  <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.06)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {roundActions.map((action, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 12,
                      background: action.decision === 'COMPLY'
                        ? 'rgba(29,185,84,0.06)'
                        : 'rgba(239,68,68,0.05)',
                      border: `1px solid ${action.decision === 'COMPLY' ? 'rgba(29,185,84,0.15)' : 'rgba(239,68,68,0.12)'}`,
                      animation: 'fadeInUp 0.2s ease both'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0F' }}>{action.name}</span>
                        <span style={{ fontSize: 11, color: '#8A8A8E' }}>{action.role}</span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                          color: action.decision === 'COMPLY' ? '#1DB954' : '#EF4444',
                          padding: '2px 8px', borderRadius: 100,
                          background: action.decision === 'COMPLY' ? 'rgba(29,185,84,0.1)' : 'rgba(239,68,68,0.08)'
                        }}>
                          {action.decision === 'COMPLY' ? '✓ Comply' : '✗ Resist'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6E6E73', lineHeight: 1.5, margin: 0 }}>
                        {action.behavior}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
