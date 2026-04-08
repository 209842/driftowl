import React, { useMemo } from 'react'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { SimulationResult, AgentBehavior } from '../types'

interface Props {
  simulation: SimulationResult
  verdict: string
}

const EQUILIBRIUM_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  cooperation: { bg: 'rgba(52,199,89,0.12)', border: 'rgba(52,199,89,0.25)', text: '#34C759' },
  defection: { bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.25)', text: '#FF3B30' },
  mixed: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.25)', text: '#FF9500' },
}

/**
 * Generate 100 data points with a sigmoid convergence from ~0.3 to finalRate,
 * with Gaussian noise via the Box-Muller transform.
 */
function generateChartData(
  finalRate: number,
  convergenceRound: number | null,
  totalRounds: number
): Array<{ round: number; rate: number }> {
  const data: Array<{ round: number; rate: number }> = []
  const convRound = convergenceRound ?? Math.floor(totalRounds * 0.55)
  const startRate = 0.28 + Math.random() * 0.06 // 0.28–0.34

  // Box-Muller Gaussian noise
  const gaussianNoise = (stddev: number): number => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0 * stddev
  }

  for (let i = 0; i <= 100; i++) {
    const round = Math.round((i / 100) * totalRounds)
    const progress = convRound > 0 ? round / convRound : 1
    // Sigmoid: 1/(1 + e^(-8*(x-0.5)))
    const sigmoid = 1 / (1 + Math.exp(-8 * (progress - 0.5)))
    // Noise decreases as convergence is reached
    const noiseScale = 0.04 * (1 - Math.min(progress, 1) * 0.75)
    const noise = gaussianNoise(noiseScale)
    const rate = startRate + (finalRate - startRate) * sigmoid + noise
    data.push({ round, rate: Math.min(Math.max(rate, 0), 1) })
  }

  return data
}

function AgentBadge({ agent }: { agent: AgentBehavior }) {
  const cooperationColor = agent.final_cooperation ? '#34C759' : '#FF3B30'
  const cooperationBg = agent.final_cooperation
    ? 'rgba(52,199,89,0.1)'
    : 'rgba(255,59,48,0.08)'
  const cooperationBorder = agent.final_cooperation
    ? 'rgba(52,199,89,0.2)'
    : 'rgba(255,59,48,0.2)'

  const wrapStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(60px) saturate(200%)',
    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '100px',
  }

  const agentIdStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6E6E73',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  }

  const coopBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: cooperationBg,
    border: `1px solid ${cooperationBorder}`,
    borderRadius: '100px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 500,
    color: cooperationColor,
    letterSpacing: '-0.1px',
  }

  const rationalityBarWrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  const rationalityBarBgStyle: React.CSSProperties = {
    flex: 1,
    height: '4px',
    background: 'rgba(0,0,0,0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  }

  const rationalityBarFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.min(Math.max(agent.rationality * 100, 0), 100)}%`,
    background: 'linear-gradient(90deg, #007AFF, #5856D6)',
    borderRadius: '2px',
    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
  }

  const rationalityLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#6E6E73',
    fontWeight: 500,
    minWidth: '28px',
    textAlign: 'right',
  }

  return (
    <div style={wrapStyle}>
      <div style={agentIdStyle}>Agent {agent.agent_id}</div>
      <div style={coopBadgeStyle}>
        {agent.final_cooperation ? '●' : '○'}{' '}
        {agent.final_cooperation ? 'Cooperates' : 'Defects'}
      </div>
      <div style={rationalityBarWrapStyle}>
        <div style={rationalityBarBgStyle}>
          <div style={rationalityBarFillStyle} />
        </div>
        <span style={rationalityLabelStyle}>
          {(agent.rationality * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        fontSize: '13px',
        color: '#1C1C1E',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <div style={{ color: '#6E6E73', marginBottom: '2px' }}>Round {label}</div>
      <div style={{ fontWeight: 600, color: '#007AFF' }}>
        {(payload[0].value * 100).toFixed(1)}% cooperation
      </div>
    </div>
  )
}

export default function SimulationChart({ simulation, verdict }: Props) {
  const eqKey = simulation.final_equilibrium.toLowerCase()
  const eqStyle = EQUILIBRIUM_STYLE[eqKey] ?? {
    bg: 'rgba(0,0,0,0.05)',
    border: 'rgba(0,0,0,0.1)',
    text: '#6E6E73',
  }

  const chartData = useMemo(
    () =>
      generateChartData(
        simulation.cooperation_rate,
        simulation.convergence_round,
        simulation.rounds
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simulation.cooperation_rate, simulation.convergence_round, simulation.rounds]
  )

  const welfarePositive = simulation.welfare_gain >= 0

  // ─── Styles ───────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: '24px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1)',
  }

  const sectionBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    background: 'rgba(0,122,255,0.1)',
    color: '#007AFF',
    borderRadius: '100px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '8px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1C1C1E',
    letterSpacing: '-0.3px',
    margin: 0,
  }

  const statPillsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  }

  const statPillStyle: React.CSSProperties = {
    flex: '1 1 120px',
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(60px) saturate(200%)',
    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
    borderRadius: '16px',
    padding: '16px 20px',
    textAlign: 'center',
  }

  const statValueStyle = (color: string): React.CSSProperties => ({
    fontSize: '34px',
    fontWeight: 700,
    color,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  })

  const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6E6E73',
    letterSpacing: '-0.1px',
    marginTop: '4px',
  }

  const eqBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    background: eqStyle.bg,
    border: `1px solid ${eqStyle.border}`,
    borderRadius: '100px',
    padding: '6px 14px',
    fontSize: '15px',
    fontWeight: 600,
    color: eqStyle.text,
    letterSpacing: '-0.2px',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#6E6E73',
    marginBottom: '12px',
  }

  const convergenceBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0,122,255,0.08)',
    border: '1px solid rgba(0,122,255,0.15)',
    borderRadius: '100px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#007AFF',
    letterSpacing: '-0.1px',
    marginTop: '12px',
  }

  const verdictSectionStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(0,0,0,0.06)',
    paddingTop: '16px',
  }

  const verdictTextStyle: React.CSSProperties = {
    fontSize: '17px',
    color: '#6E6E73',
    fontStyle: 'italic',
    lineHeight: 1.6,
    letterSpacing: '-0.2px',
    margin: 0,
  }

  const agentGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  }

  const displayedAgents = simulation.agent_behaviors.slice(0, 5)

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div>
        <div style={sectionBadgeStyle}>Simulation</div>
        <h2 style={titleStyle}>Agent Behavior</h2>
      </div>

      {/* Stat pills */}
      <div style={statPillsRowStyle}>
        <div style={statPillStyle}>
          <div style={statValueStyle('#007AFF')}>
            {(simulation.cooperation_rate * 100).toFixed(0)}%
          </div>
          <div style={statLabelStyle}>Cooperation Rate</div>
        </div>

        <div style={statPillStyle}>
          <div style={statValueStyle(welfarePositive ? '#34C759' : '#FF3B30')}>
            {welfarePositive ? '+' : ''}
            {simulation.welfare_gain.toFixed(0)}%
          </div>
          <div style={statLabelStyle}>Welfare Gain</div>
        </div>

        <div style={{ ...statPillStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={eqBadgeStyle}>{simulation.final_equilibrium}</span>
          <div style={statLabelStyle}>Equilibrium</div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div style={sectionLabelStyle}>Cooperation Over Time</div>
        <div style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="cooperationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="round"
                tick={{ fill: '#6E6E73', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={19}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#6E6E73', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#007AFF"
                strokeWidth={2}
                fill="url(#cooperationGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#007AFF', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {simulation.convergence_round !== null && (
          <div style={convergenceBadgeStyle}>
            <span>⚡</span>
            <span>Converged at round {simulation.convergence_round}</span>
          </div>
        )}
      </div>

      {/* Agent behaviors */}
      {displayedAgents.length > 0 && (
        <div>
          <div style={sectionLabelStyle}>
            Agent Breakdown ({displayedAgents.length} of {simulation.agent_behaviors.length})
          </div>
          <div style={agentGridStyle}>
            {displayedAgents.map((agent) => (
              <AgentBadge key={agent.agent_id} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      <div style={verdictSectionStyle}>
        <div style={{ ...sectionLabelStyle, marginBottom: '8px' }}>Verdict</div>
        <p style={verdictTextStyle}>&ldquo;{verdict}&rdquo;</p>
      </div>
    </div>
  )
}
