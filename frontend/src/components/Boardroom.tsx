import React, { useState, useEffect } from 'react'
import { AgentNode, SynthesisData, ArbitrationData, Mode, Persona, RoundSummary, SimulationComplete } from '../types'
import { API } from '../config'
import AgentGraph from './AgentGraph'
import AgentFeed from './AgentFeed'
import PaperView from './PaperView'

export default function Boardroom({
  sessionId, mode, problem, onReset
}: {
  sessionId: string
  mode: Mode
  problem: string
  onReset: () => void
}) {
  const [agents, setAgents]           = useState<AgentNode[]>([])
  const [contrarians, setContrarians] = useState<AgentNode[]>([])
  const [synthesis, setSynthesis]     = useState<SynthesisData | null>(null)
  const [arbitration, setArbitration] = useState<ArbitrationData | null>(null)
  const [status, setStatus]           = useState<'streaming' | 'done'>('streaming')
  const [statusMsg, setStatusMsg]     = useState('Assembling experts...')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  // Simulation state
  const [personas, setPersonas]               = useState<Persona[]>([])
  const [personaDecisions, setPersonaDecisions] = useState<Record<string, string>>({})
  const [roundSummaries, setRoundSummaries]   = useState<RoundSummary[]>([])
  const [currentRound, setCurrentRound]       = useState<number>(0)
  const [simComplete, setSimComplete]         = useState<SimulationComplete | null>(null)

  // Paper view
  const [showPaper, setShowPaper] = useState(false)

  useEffect(() => {
    const es = new EventSource(`${API}/session/${sessionId}/stream`)

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
        const data: SynthesisData = {
          mechanism_name: raw.mechanism_name || 'Synthesis',
          core_insight: raw.core_insight || '',
          rules: Array.isArray(raw.rules) ? raw.rules : [],
          explanation: raw.explanation || '',
          expected_outcome: raw.expected_outcome || '',
        }
        setSynthesis(data)
        fetch(`${API}/session/${sessionId}/synthesis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(() => {})
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

    // Simulation events
    es.addEventListener('persona', (e) => {
      try {
        const p = JSON.parse(e.data) as Persona
        setPersonas(prev => [...prev, p])
        setStatusMsg(`Building population: ${p.name}...`)
      } catch {}
    })

    es.addEventListener('agent_action', (e) => {
      try {
        const action = JSON.parse(e.data)
        setPersonaDecisions(prev => ({ ...prev, [action.id]: action.decision }))
      } catch {}
    })

    es.addEventListener('round_start', (e) => {
      try {
        const data = JSON.parse(e.data)
        setCurrentRound(data.round)
        setStatusMsg(`Virtual society — Round ${data.round}/7...`)
      } catch {}
    })

    es.addEventListener('round_end', (e) => {
      try {
        const data = JSON.parse(e.data) as RoundSummary
        setRoundSummaries(prev => [...prev, data])
      } catch {}
    })

    es.addEventListener('simulation_complete', (e) => {
      try {
        const data = JSON.parse(e.data) as SimulationComplete
        setSimComplete(data)
        setStatusMsg('Analysis complete')
      } catch {}
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

  if (showPaper && synthesis) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '10px 20px', height: 48, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(248,249,251,0.95)',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0F' }}>DriftOwl — Research Paper</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowPaper(false)} style={{
              background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 13, color: '#6E6E73', cursor: 'pointer'
            }}>← Back to Analysis</button>
            <button onClick={onReset} style={{
              background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 13, color: '#6E6E73', cursor: 'pointer'
            }}>New Analysis</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PaperView
            sessionId={sessionId}
            synthesis={synthesis}
            simulationResults={simComplete?.rounds_data ?? []}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '10px 20px', height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(248,249,251,0.88)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0F' }}>DriftOwl</span>
          <span style={{
            fontSize: 13, color: '#6E6E73', maxWidth: 340,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{problem}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {status === 'streaming' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#F59E0B',
                animation: 'pulse 1s ease infinite'
              }} />
              <span style={{ fontSize: 12, color: '#6E6E73' }}>{statusMsg}</span>
            </div>
          )}
          {status === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1DB954' }} />
              <span style={{ fontSize: 12, color: '#1DB954' }}>Complete</span>
            </div>
          )}
          <span style={{ fontSize: 12, color: '#AEAEB2' }}>
            {agents.length}e · {contrarians.length}c · {personas.length}p
          </span>
          {simComplete && (
            <button onClick={() => setShowPaper(true)} style={{
              background: 'rgba(28,110,243,0.08)', border: '1px solid rgba(28,110,243,0.2)',
              borderRadius: 8, padding: '5px 12px',
              fontSize: 12, color: '#1C6EF3', cursor: 'pointer', fontWeight: 600
            }}>Research Paper →</button>
          )}
          <button onClick={onReset} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            padding: '5px 12px', fontSize: 12, color: '#6E6E73', cursor: 'pointer'
          }}>New Analysis</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Graph: left 55% */}
        <div style={{ flex: '0 0 55%', position: 'relative' }}>
          <AgentGraph
            agents={agents}
            contrarians={contrarians}
            synthesis={synthesis}
            arbitration={arbitration}
            personas={personas}
            personaDecisions={personaDecisions}
            onAgentSelect={setSelectedAgentId}
            selectedAgentId={selectedAgentId}
          />
        </div>

        {/* Feed: right 45% */}
        <div style={{ flex: '0 0 45%', borderLeft: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <AgentFeed
            agents={agents}
            contrarians={contrarians}
            synthesis={synthesis}
            arbitration={arbitration}
            selectedAgentId={selectedAgentId}
            personas={personas}
            personaDecisions={personaDecisions}
            roundSummaries={roundSummaries}
            currentRound={currentRound}
            simComplete={simComplete}
            onGeneratePaper={simComplete ? () => setShowPaper(true) : undefined}
          />
        </div>
      </div>
    </div>
  )
}
