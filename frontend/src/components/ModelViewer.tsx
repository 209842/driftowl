import React from 'react'
import { GameModel, Player } from '../types'

interface Props {
  gameModel: GameModel
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #007AFF, #5856D6)',
  'linear-gradient(135deg, #34C759, #30D158)',
  'linear-gradient(135deg, #FF9500, #FF6B00)',
  'linear-gradient(135deg, #FF3B30, #FF2D55)',
  'linear-gradient(135deg, #AF52DE, #5856D6)',
  'linear-gradient(135deg, #00C7BE, #007AFF)',
]

const INFO_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  complete: { bg: 'rgba(52,199,89,0.1)', border: 'rgba(52,199,89,0.25)', text: '#34C759' },
  incomplete: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.25)', text: '#FF9500' },
  asymmetric: { bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.25)', text: '#FF3B30' },
}

function PlayerCard({ player, index }: { player: Player; index: number }) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(60px) saturate(200%)',
    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
    borderRadius: '16px',
    padding: '16px',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  }

  const avatarStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  }

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  }

  const nameStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1C1C1E',
    letterSpacing: '-0.2px',
  }

  const utilityStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6E6E73',
    fontStyle: 'italic',
    lineHeight: 1.5,
    marginBottom: '10px',
  }

  const actionsWrapStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  }

  const actionTagStyle: React.CSSProperties = {
    background: 'rgba(0,122,255,0.08)',
    border: '1px solid rgba(0,122,255,0.12)',
    borderRadius: '100px',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#007AFF',
    letterSpacing: '-0.1px',
  }

  const bulletStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: gradient,
    flexShrink: 0,
    marginTop: '6px',
  }

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <div style={avatarStyle}>{initials}</div>
        <div style={nameStyle}>{player.name}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={bulletStyle} />
        <p style={{ ...utilityStyle, marginBottom: 0 }}>{player.utility_description}</p>
      </div>
      <div style={actionsWrapStyle}>
        {player.possible_actions.map((action) => (
          <span key={action} style={actionTagStyle}>
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ModelViewer({ gameModel }: Props) {
  const infoKey = gameModel.information_structure.toLowerCase()
  const infoColors = INFO_COLORS[infoKey] ?? {
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
    animation: 'fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1)',
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

  const infoBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: infoColors.bg,
    border: `1px solid ${infoColors.border}`,
    borderRadius: '100px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: infoColors.text,
    letterSpacing: '-0.1px',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gameModel.players.length > 1 ? '1fr 1fr' : '1fr',
    gap: '12px',
  }

  const goalBoxStyle: React.CSSProperties = {
    background: 'rgba(52,199,89,0.08)',
    border: '1px solid rgba(52,199,89,0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
  }

  const goalLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#34C759',
    marginBottom: '6px',
  }

  const goalTextStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#1C1C1E',
    lineHeight: 1.55,
    margin: 0,
    letterSpacing: '-0.1px',
  }

  return (
    <div style={cardStyle}>
      <div>
        <div style={sectionBadgeStyle}>Game Model</div>
        <h2 style={titleStyle}>Players & Incentives</h2>
      </div>

      <div>
        <span style={infoBadgeStyle}>
          <span>Information:</span>
          <strong>{gameModel.information_structure}</strong>
        </span>
      </div>

      <div style={gridStyle}>
        {gameModel.players.map((player, i) => (
          <PlayerCard key={player.id} player={player} index={i} />
        ))}
      </div>

      <div style={goalBoxStyle}>
        <div style={goalLabelStyle}>Goal</div>
        <p style={goalTextStyle}>{gameModel.goal}</p>
      </div>
    </div>
  )
}
