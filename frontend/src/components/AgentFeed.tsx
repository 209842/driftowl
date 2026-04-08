import React, { useRef, useEffect } from 'react'
import { AgentNode, SynthesisData } from '../types'

export default function AgentFeed({
  agents, synthesis, onTestSociety, selectedAgentId
}: {
  agents: AgentNode[]
  synthesis: SynthesisData | null
  onTestSociety?: () => void
  selectedAgentId?: string | null
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agents.length, synthesis])

  useEffect(() => {
    if (!selectedAgentId) return
    const el = cardRefs.current.get(selectedAgentId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedAgentId])

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {agents.length === 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#6E6E73', fontSize: 15
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🦉</div>
            <div>Experts assembling...</div>
          </div>
        </div>
      )}

      {agents.map((agent) => (
        <div
          key={agent.id}
          ref={el => {
            if (el) cardRefs.current.set(agent.id, el)
            else cardRefs.current.delete(agent.id)
          }}
          style={{
            background: selectedAgentId === agent.id
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(255,255,255,0.68)',
            border: selectedAgentId === agent.id
              ? `1px solid ${agent.color}60`
              : '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: '14px 16px',
            animation: 'fadeInUp 0.3s ease both',
            borderLeft: `3px solid ${agent.color}${selectedAgentId === agent.id ? 'cc' : '40'}`,
            transition: 'all 0.2s ease',
            boxShadow: selectedAgentId === agent.id
              ? `0 4px 20px ${agent.color}20`
              : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: agent.color, flexShrink: 0
            }}>
              {agent.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>{agent.name}</div>
              <div style={{ fontSize: 11, color: '#6E6E73' }}>{agent.role}</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.6, margin: 0 }}>
            {agent.analysis}
          </p>
        </div>
      ))}

      {synthesis && (
        <div style={{
          background: 'rgba(255,248,220,0.6)',
          border: '1px solid rgba(255,200,50,0.3)',
          borderRadius: 20,
          padding: 20,
          marginTop: 8,
          animation: 'fadeInUp 0.5s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0F' }}>
                {synthesis.mechanism_name}
              </div>
              <div style={{ fontSize: 11, color: '#8A8A8E', letterSpacing: 1 }}>SYNTHESIS</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,200,50,0.08)', borderRadius: 12, padding: '10px 14px',
            marginBottom: 12, fontStyle: 'italic', fontSize: 14, color: '#0A0A0F', lineHeight: 1.5
          }}>
            &ldquo;{synthesis.core_insight}&rdquo;
          </div>

          <div style={{ marginBottom: 12 }}>
            {synthesis.rules.map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,200,50,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#0A0A0F', marginTop: 1
                }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.5 }}>{rule}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.5, marginBottom: 10 }}>
            {synthesis.explanation}
          </div>

          <div style={{
            background: 'rgba(29,185,84,0.07)', border: '1px solid rgba(29,185,84,0.2)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1DB954',
            marginBottom: 14
          }}>
            📈 {synthesis.expected_outcome}
          </div>

          {onTestSociety && (
            <button
              onClick={onTestSociety}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', letterSpacing: -0.2
              }}
            >
              🧪 Test in Virtual Society →
            </button>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
