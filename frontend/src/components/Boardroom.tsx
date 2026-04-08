import React, { useState, useEffect } from 'react'
import { AgentNode, SynthesisData, ArbitrationData, Mode, BoardroomPhase } from '../types'
import AgentGraph from './AgentGraph'
import AgentFeed from './AgentFeed'
import SimulationPhase from './SimulationPhase'
import PaperView from './PaperView'

export default function Boardroom({
  sessionId, mode, problem, onReset
}: {
  sessionId: string
  mode: Mode
  problem: string
  onReset: () => void
}) {
  const [agents, setAgents] = useState<AgentNode[]>([])
  const [contrarians, setContrarians] = useState<AgentNode[]>([])
  const [synthesis, setSynthesis] = useState<SynthesisData | null>(null)
  const [arbitration, setArbitration] = useState<ArbitrationData | null>(null)
  const [status, setStatus] = useState<'streaming' | 'done'>('streaming')
  const [statusMsg, setStatusMsg] = useState('Assembling experts...')
  const [phase, setPhase] = useState<BoardroomPhase>('design')
  const [simulationResults, setSimulationResults] = useState<number[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    const es = new EventSource(`http://localhost:8000/session/${sessionId}/stream`)

    es.addEventListener('agent', (e) => {
      try {
        const agent = JSON.parse(e.data) as AgentNode
        setAgents(prev => [...prev, agent])
        setStatusMsg(`${agent.name} is analyzing...`)
      } catch {}
    })

    es.addEventListener('status', (e) => {
      try {
        const data = JSON.parse(e.data)
        setStatusMsg(data.message)
      } catch {}
    })

    es.addEventListener('synthesis', (e) => {
      try {
        const raw = JSON.parse(e.data)
        // Normalize: ensure all fields are present
        const data: SynthesisData = {
          mechanism_name: raw.mechanism_name || 'Synthesis',
          core_insight: raw.core_insight || '',
          rules: Array.isArray(raw.rules) ? raw.rules : [],
          explanation: raw.explanation || '',
          expected_outcome: raw.expected_outcome || '',
        }
        setSynthesis(data)
        fetch(`http://localhost:8000/session/${sessionId}/synthesis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      } catch (err) {
        console.error('synthesis parse error', err)
      }
    })

    es.addEventListener('contrarian_agent', (e) => {
      try {
        const agent = JSON.parse(e.data) as AgentNode
        setContrarians(prev => [...prev, agent])
        setStatusMsg(`${agent.name} challenging...`)
      } catch {}
    })

    es.addEventListener('arbitration', (e) => {
      try {
        const raw = JSON.parse(e.data)
        const data: ArbitrationData = {
          verdict: raw.verdict || 'STRENGTHENED',
          robustness_score: raw.robustness_score ?? 5,
          critical_vulnerabilities: Array.isArray(raw.critical_vulnerabilities) ? raw.critical_vulnerabilities : [],
          arbitration_reasoning: raw.arbitration_reasoning || '',
          mechanism_name: raw.mechanism_name || '',
          core_insight: raw.core_insight || '',
          rules: Array.isArray(raw.rules) ? raw.rules : [],
          explanation: raw.explanation || '',
          expected_outcome: raw.expected_outcome || '',
        }
        setArbitration(data)
      } catch (err) {
        console.error('arbitration parse error', err)
      }
    })

    es.addEventListener('done', () => {
      setStatus('done')
      es.close()
    })

    es.onerror = () => {
      es.close()
      setStatus('done')
    }

    return () => es.close()
  }, [sessionId])

  const tabs: { id: BoardroomPhase; label: string; emoji: string; disabled: boolean }[] = [
    { id: 'design', label: 'Expert Design', emoji: '①', disabled: false },
    { id: 'simulation', label: 'Virtual Test', emoji: '②', disabled: !arbitration },
    { id: 'paper', label: 'Research Paper', emoji: '③', disabled: simulationResults.length === 0 },
  ]

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(248,249,251,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0F' }}>DriftOwl</span>
          <span style={{
            fontSize: 13, color: '#6E6E73', maxWidth: 340,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{problem}</span>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, background: 'rgba(0,0,0,0.04)',
          borderRadius: 12, padding: 3
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setPhase(tab.id)}
              disabled={tab.disabled}
              style={{
                padding: '6px 14px', borderRadius: 9, border: 'none',
                background: phase === tab.id ? 'rgba(255,255,255,0.95)' : 'transparent',
                boxShadow: phase === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontSize: 13, fontWeight: phase === tab.id ? 600 : 400,
                color: tab.disabled ? '#C7C7CC' : phase === tab.id ? '#0A0A0F' : '#6E6E73',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'streaming' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                animation: 'pulse 1s ease infinite'
              }} />
              <span style={{ fontSize: 13, color: '#6E6E73' }}>{statusMsg}</span>
            </div>
          )}
          {status === 'done' && phase === 'design' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954' }} />
              <span style={{ fontSize: 13, color: '#1DB954' }}>Analysis complete</span>
            </div>
          )}
          <span style={{ fontSize: 13, color: '#6E6E73' }}>{agents.length} experts · {contrarians.length} contrarians</span>
          <button onClick={onReset} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            padding: '6px 12px', fontSize: 13, color: '#6E6E73', cursor: 'pointer'
          }}>New Analysis</button>
        </div>
      </div>

      {/* Phase content */}
      {phase === 'design' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 60%', position: 'relative' }}>
            <AgentGraph
              agents={agents}
              contrarians={contrarians}
              synthesis={synthesis}
              arbitration={arbitration}
              onAgentSelect={setSelectedAgentId}
              selectedAgentId={selectedAgentId}
            />
          </div>
          <div style={{
            flex: '0 0 40%',
            borderLeft: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <AgentFeed
              agents={agents}
              contrarians={contrarians}
              synthesis={synthesis}
              arbitration={arbitration}
              onTestSociety={arbitration ? () => setPhase('simulation') : undefined}
              selectedAgentId={selectedAgentId}
            />
          </div>
        </div>
      )}

      {phase === 'simulation' && synthesis && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SimulationPhase
            sessionId={sessionId}
            synthesis={synthesis}
            onComplete={(results) => setSimulationResults(results)}
            onGeneratePaper={() => setPhase('paper')}
          />
        </div>
      )}

      {phase === 'paper' && synthesis && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PaperView
            sessionId={sessionId}
            synthesis={synthesis}
            simulationResults={simulationResults}
          />
        </div>
      )}
    </div>
  )
}
