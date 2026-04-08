import React, { useState } from 'react'
import { Mechanism } from '../types'

interface Props {
  mechanism: Mechanism
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  auction: { bg: 'rgba(175,82,222,0.1)', border: 'rgba(175,82,222,0.25)', text: '#AF52DE' },
  incentive: { bg: 'rgba(0,122,255,0.1)', border: 'rgba(0,122,255,0.25)', text: '#007AFF' },
  voting: { bg: 'rgba(52,199,89,0.1)', border: 'rgba(52,199,89,0.25)', text: '#34C759' },
  coordination: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.25)', text: '#FF9500' },
  tax: { bg: 'rgba(88,86,214,0.1)', border: 'rgba(88,86,214,0.25)', text: '#5856D6' },
  subsidy: { bg: 'rgba(0,199,190,0.1)', border: 'rgba(0,199,190,0.25)', text: '#00C7BE' },
}

export default function MechanismOutput({ mechanism }: Props) {
  const [codeExpanded, setCodeExpanded] = useState(false)

  const typeKey = mechanism.type.toLowerCase()
  const typeColors = TYPE_COLORS[typeKey] ?? {
    bg: 'rgba(0,0,0,0.05)',
    border: 'rgba(0,0,0,0.1)',
    text: '#6E6E73',
  }

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
    animation: 'fadeInUp 0.5s cubic-bezier(0.4,0,0.2,1)',
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

  const badgeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  }

  const typeBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    background: typeColors.bg,
    border: `1px solid ${typeColors.border}`,
    borderRadius: '100px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: typeColors.text,
    letterSpacing: '-0.1px',
  }

  const propBadge = (pass: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: pass ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.1)',
    border: `1px solid ${pass ? 'rgba(52,199,89,0.25)' : 'rgba(255,59,48,0.25)'}`,
    borderRadius: '100px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: pass ? '#34C759' : '#FF3B30',
    letterSpacing: '-0.1px',
  })

  const explanationBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(60px) saturate(200%)',
    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  }

  const explanationIconStyle: React.CSSProperties = {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '1px',
  }

  const explanationTextStyle: React.CSSProperties = {
    fontSize: '17px',
    color: '#1C1C1E',
    lineHeight: 1.6,
    letterSpacing: '-0.2px',
    margin: 0,
  }

  const rulesSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#6E6E73',
    marginBottom: '4px',
  }

  const ruleItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  }

  const ruleNumberStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: '#ffffff',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,122,255,0.3)',
  }

  const ruleTextStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#1C1C1E',
    lineHeight: 1.55,
    letterSpacing: '-0.1px',
    paddingTop: '2px',
  }

  const codeToggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: codeExpanded ? '12px 12px 0 0' : '12px',
    border: '1px solid rgba(0,0,0,0.06)',
    borderBottom: codeExpanded ? '1px solid rgba(0,0,0,0.06)' : undefined,
    transition: 'all 0.2s ease',
  }

  const codeToggleLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6E6E73',
    letterSpacing: '-0.1px',
    fontFamily: "'Fira Code', 'Cascadia Code', 'SF Mono', 'Courier New', monospace",
  }

  const codeToggleArrowStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6E6E73',
    transform: codeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  }

  const codeBlockStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
    padding: '16px',
    overflowX: 'auto',
    maxHeight: '200px',
    overflowY: 'auto',
  }

  const codeStyle: React.CSSProperties = {
    fontSize: '13px',
    fontFamily: "'Fira Code', 'Cascadia Code', 'SF Mono', 'Courier New', monospace",
    color: '#1C1C1E',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre',
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div>
        <div style={sectionBadgeStyle}>Mechanism</div>
        <h2 style={titleStyle}>{mechanism.name}</h2>
      </div>

      {/* Badges row */}
      <div style={badgeRowStyle}>
        <span style={typeBadgeStyle}>{mechanism.type}</span>
        <span style={propBadge(mechanism.incentive_compatible)}>
          {mechanism.incentive_compatible ? '✓' : '✗'} IC
        </span>
        <span style={propBadge(mechanism.individually_rational)}>
          {mechanism.individually_rational ? '✓' : '✗'} IR
        </span>
      </div>

      {/* Explanation */}
      <div style={explanationBoxStyle}>
        <span style={explanationIconStyle}>💡</span>
        <p style={explanationTextStyle}>{mechanism.explanation}</p>
      </div>

      {/* Rules */}
      <div>
        <div style={sectionLabelStyle}>Rules</div>
        <div style={rulesSectionStyle}>
          {mechanism.rules.map((rule, i) => (
            <div key={i} style={ruleItemStyle}>
              <div style={ruleNumberStyle}>{i + 1}</div>
              <span style={ruleTextStyle}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code — collapsible */}
      <div>
        <div style={sectionLabelStyle}>Implementation</div>
        <div
          style={codeToggleStyle}
          onClick={() => setCodeExpanded((v) => !v)}
          role="button"
          aria-expanded={codeExpanded}
        >
          <span style={codeToggleLabelStyle}>{'{ } show code'}</span>
          <span style={codeToggleArrowStyle}>▼</span>
        </div>
        {codeExpanded && (
          <div style={codeBlockStyle}>
            <pre style={codeStyle}>{mechanism.code}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
