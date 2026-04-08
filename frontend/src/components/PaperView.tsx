import React, { useState, useEffect } from 'react'
import { Paper, SynthesisData } from '../types'

interface Props {
  sessionId: string
  synthesis: SynthesisData
  simulationResults: number[]
}

export default function PaperView({ sessionId, synthesis, simulationResults }: Props) {
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:8000/session/${sessionId}/paper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(data => { setPaper(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const buildText = () =>
    `${paper!.title}\n\n${paper!.authors.join(', ')} · ${paper!.date}\n\nKeywords: ${paper!.keywords.join(', ')}\n\nABSTRACT\n${paper!.abstract}\n\n${paper!.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}\n\nREFERENCES\n${paper!.references.join('\n')}`

  const copyText = () => {
    if (!paper) return
    navigator.clipboard.writeText(buildText())
  }

  const downloadPaper = () => {
    if (!paper) return
    const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 32, height: 32, border: '2px solid rgba(0,0,0,0.08)',
        borderTop: '2px solid #1C6EF3', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: 15, color: '#8A8A8E' }}>Writing research paper...</span>
    </div>
  )

  if (!paper) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#8A8A8E' }}>Failed to generate paper.</span>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', maxWidth: 760, margin: '0 auto' }}>
      {/* Paper header */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: '#1C6EF3',
          marginBottom: 12, textTransform: 'uppercase'
        }}>
          DriftOwl Research · Mechanism Design Study
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0F', lineHeight: 1.3, marginBottom: 12, letterSpacing: -0.5 }}>
          {paper.title}
        </h1>
        <div style={{ fontSize: 13, color: '#8A8A8E', marginBottom: 16 }}>
          {paper.authors.join(', ')} · {paper.date}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {paper.keywords.map(k => (
            <span key={k} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 100,
              background: 'rgba(28,110,243,0.08)', color: '#1C6EF3',
              border: '1px solid rgba(28,110,243,0.15)'
            }}>{k}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyText} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.8)', fontSize: 13, color: '#0A0A0F',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            📋 Copy full text
          </button>
          <button onClick={downloadPaper} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.8)', fontSize: 13, color: '#0A0A0F',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            ⬇️ Download .txt
          </button>
        </div>
      </div>

      {/* Abstract */}
      <div style={{
        background: 'rgba(28,110,243,0.04)', border: '1px solid rgba(28,110,243,0.1)',
        borderRadius: 16, padding: 20, marginBottom: 28
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#1C6EF3', marginBottom: 8 }}>ABSTRACT</div>
        <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.7, margin: 0 }}>{paper.abstract}</p>
      </div>

      {/* Sections */}
      {paper.sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0F', marginBottom: 10, letterSpacing: -0.3 }}>
            {section.title}
          </h2>
          <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.8, margin: 0 }}>
            {section.content}
          </p>
        </div>
      ))}

      {/* References */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0F', marginBottom: 12, letterSpacing: -0.3 }}>
          References
        </h2>
        {paper.references.map((ref, i) => (
          <p key={i} style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.6, marginBottom: 6 }}>
            {ref}
          </p>
        ))}
      </div>
    </div>
  )
}
