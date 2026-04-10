import React, { useEffect, useState } from 'react'

import { API } from '../config'
function getToken() { return localStorage.getItem('driftowl_token') || '' }

interface Section { title: string; content: string }
interface Paper {
  title: string; abstract: string; keywords: string[]
  sections: Section[]; references: string[]
}
interface Analysis {
  id: string; mode: string; title: string; problem: string
  context: string; status: string; created_at: string
  synthesis?: { mechanism_name: string; core_insight: string; rules: string[]; explanation: string; expected_outcome: string }
  simulation?: { final_comply_rate: number; peak_comply_rate: number; trend: string; population_size: number; rounds_data: number[] }
  paper?: Paper
}

const STATUS_COLOR: Record<string, string> = {
  in_progress: '#D97706', synthesis_complete: '#1C6EF3',
  simulation_complete: '#7C3AED', completed: '#059669',
}
const STATUS_LABEL: Record<string, string> = {
  in_progress: 'In progress', synthesis_complete: 'Synthesis done',
  simulation_complete: 'Simulation done', completed: 'Completed',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.9, margin: '0 0 14px' }}>{children}</h3>
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.07)', padding: '24px 28px', marginBottom: 16, ...style }}>
      {children}
    </div>
  )
}

function MiniChart({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null
  const w = 300, h = 80, pad = 8
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="#1C6EF3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = h - pad - (v / max) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r="3" fill="#1C6EF3"/>
      })}
    </svg>
  )
}

export default function AnalysisDetailPage({ analysisId, onBack }: { analysisId: string; onBack: () => void }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'synthesis' | 'simulation' | 'paper'>('synthesis')

  const user = (() => { try { return JSON.parse(localStorage.getItem('driftowl_user') || '{}') } catch { return {} } })()

  useEffect(() => {
    fetch(`${API}/analyses/${analysisId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.synthesis && typeof data.synthesis === 'string') data.synthesis = JSON.parse(data.synthesis)
          if (data.simulation && typeof data.simulation === 'string') data.simulation = JSON.parse(data.simulation)
          if (data.paper && typeof data.paper === 'string') data.paper = JSON.parse(data.paper)
          setAnalysis(data)
          // Set default tab to deepest completed phase
          if (data.paper) setTab('paper')
          else if (data.simulation) setTab('simulation')
          else setTab('synthesis')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [analysisId])

  const downloadPaper = () => {
    if (!analysis?.paper) return
    const p = analysis.paper
    let txt = `${p.title}\n${'='.repeat(p.title.length)}\n\nAbstract\n${p.abstract}\n\n`
    p.sections?.forEach(s => { txt += `${s.title}\n${'-'.repeat(s.title.length)}\n${s.content}\n\n` })
    if (p.references?.length) txt += `References\n${p.references.map((r, i) => `[${i+1}] ${r}`).join('\n')}`
    const blob = new Blob([txt], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${p.title?.replace(/[^a-z0-9]/gi,'_') || 'paper'}.txt`
    a.click()
  }

  const statusColor = STATUS_COLOR[analysis?.status || ''] || '#AEAEB2'
  const statusLabel = STATUS_LABEL[analysis?.status || ''] || analysis?.status || ''
  const date = analysis ? new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  const TABS = [
    { id: 'synthesis' as const,   label: 'Mechanism',  disabled: !analysis?.synthesis },
    { id: 'simulation' as const,  label: 'Simulation', disabled: !analysis?.simulation },
    { id: 'paper' as const,       label: 'Paper',      disabled: !analysis?.paper },
  ]

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F6F8FC' }}>

      {/* Navbar */}
      <div style={{
        padding: '0 40px', height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(246,248,252,0.95)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#8A8A8E', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
            <span style={{ fontSize: 15 }}>←</span> Dashboard
          </button>
          <span style={{ color: 'rgba(0,0,0,0.12)', fontSize: 16 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#0A0A0F' }}>DriftOwl</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1C6EF3,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            {user?.first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: 13, color: '#3C3C43', fontWeight: 500 }}>{user?.first_name || 'User'}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px 56px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {loading ? (
            <p style={{ color: '#AEAEB2', fontSize: 14 }}>Loading…</p>
          ) : !analysis ? (
            <p style={{ color: '#DC2626', fontSize: 14 }}>Analysis not found.</p>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: `${statusColor}15`, color: statusColor }}>
                    {statusLabel}
                  </span>
                  <span style={{ fontSize: 12, color: '#AEAEB2' }}>{date}</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', margin: '0 0 6px' }}>
                  {analysis.title || 'Analysis'}
                </h1>
                <p style={{ fontSize: 14, color: '#8A8A8E', margin: 0, lineHeight: 1.6 }}>{analysis.problem}</p>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => !t.disabled && setTab(t.id)} disabled={t.disabled} style={{
                    padding: '7px 18px', borderRadius: 8, border: 'none', cursor: t.disabled ? 'default' : 'pointer',
                    background: tab === t.id ? '#fff' : 'transparent',
                    color: t.disabled ? '#AEAEB2' : tab === t.id ? '#0A0A0F' : '#6B6B70',
                    fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                    boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>

              {/* Mechanism tab */}
              {tab === 'synthesis' && analysis.synthesis && (
                <>
                  <Card>
                    <SectionTitle>Mechanism</SectionTitle>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A0A0F', margin: '0 0 10px', letterSpacing: -0.4 }}>
                      {analysis.synthesis.mechanism_name}
                    </h2>
                    <p style={{ fontSize: 14, color: '#1C6EF3', fontWeight: 600, margin: '0 0 14px', lineHeight: 1.5 }}>
                      {analysis.synthesis.core_insight}
                    </p>
                    <p style={{ fontSize: 13, color: '#6B6B70', margin: 0, lineHeight: 1.7 }}>
                      {analysis.synthesis.explanation}
                    </p>
                  </Card>
                  <Card>
                    <SectionTitle>Core rules</SectionTitle>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      {analysis.synthesis.rules.map((r, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.7, marginBottom: 6 }}>{r}</li>
                      ))}
                    </ol>
                  </Card>
                  <Card>
                    <SectionTitle>Expected outcome</SectionTitle>
                    <p style={{ fontSize: 13, color: '#3C3C43', margin: 0, lineHeight: 1.7 }}>{analysis.synthesis.expected_outcome}</p>
                  </Card>
                </>
              )}

              {/* Simulation tab */}
              {tab === 'simulation' && analysis.simulation && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Final compliance', value: `${Math.round(analysis.simulation.final_comply_rate * 100)}%` },
                      { label: 'Peak compliance', value: `${Math.round(analysis.simulation.peak_comply_rate * 100)}%` },
                      { label: 'Trend', value: analysis.simulation.trend },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.07)', padding: '18px 20px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>{stat.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#0A0A0F', margin: 0, letterSpacing: -0.5 }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <Card>
                    <SectionTitle>Compliance over rounds</SectionTitle>
                    <MiniChart data={analysis.simulation.rounds_data} />
                    <p style={{ fontSize: 12, color: '#AEAEB2', margin: '8px 0 0' }}>
                      {analysis.simulation.population_size} agents · {analysis.simulation.rounds_data?.length || 0} rounds
                    </p>
                  </Card>
                </>
              )}

              {/* Paper tab */}
              {tab === 'paper' && analysis.paper && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={downloadPaper} style={{
                      padding: '8px 18px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.10)',
                      background: '#fff', fontSize: 13, fontWeight: 600, color: '#3C3C43', cursor: 'pointer',
                    }}>↓ Download .txt</button>
                  </div>
                  <Card>
                    <SectionTitle>Abstract</SectionTitle>
                    <p style={{ fontSize: 13, color: '#3C3C43', margin: 0, lineHeight: 1.75 }}>{analysis.paper.abstract}</p>
                    {analysis.paper.keywords?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                        {analysis.paper.keywords.map(k => (
                          <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(0,0,0,0.04)', color: '#6B6B70' }}>{k}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                  {analysis.paper.sections?.map((s, i) => (
                    <Card key={i}>
                      <SectionTitle>{s.title}</SectionTitle>
                      <p style={{ fontSize: 13, color: '#3C3C43', margin: 0, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.content}</p>
                    </Card>
                  ))}
                </>
              )}

              {/* Incomplete state */}
              {tab === 'synthesis' && !analysis.synthesis && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#AEAEB2' }}>
                  <p style={{ fontSize: 14 }}>This analysis is still in progress.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
