import React, { useState, useRef } from 'react'

interface Props {
  onSubmit: (problem: string) => void
  loading: boolean
}

export default function ProblemInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [pressed, setPressed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (value.trim().length < 20 || loading) return
    onSubmit(value.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  const isDisabled = loading || value.trim().length < 20
  const charCount = value.length

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: focused
      ? '1px solid rgba(0,122,255,0.4)'
      : '1px solid rgba(255,255,255,0.8)',
    boxShadow: focused
      ? '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 4px rgba(0,122,255,0.08)'
      : '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: '24px',
    padding: '24px',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    cursor: 'text',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '1.5px',
    color: '#6E6E73',
    textTransform: 'uppercase',
    marginBottom: '10px',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '17px',
    fontWeight: 400,
    letterSpacing: '-0.2px',
    color: '#1C1C1E',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    resize: 'none',
    padding: 0,
  }

  const separatorStyle: React.CSSProperties = {
    height: '1px',
    background: 'rgba(0,0,0,0.06)',
    margin: '16px 0',
  }

  const bottomBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const charCountStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: charCount > 0 ? '#6E6E73' : 'rgba(0,0,0,0.2)',
    letterSpacing: '0',
    transition: 'color 0.2s ease',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(0,0,0,0.25)',
    letterSpacing: '-0.1px',
  }

  const buttonStyle: React.CSSProperties = {
    background: isDisabled
      ? 'rgba(0,0,0,0.08)'
      : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: isDisabled ? 'rgba(0,0,0,0.3)' : '#ffffff',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    letterSpacing: '-0.1px',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    transform: pressed && !isDisabled ? 'scale(0.97)' : 'scale(1)',
    boxShadow: isDisabled
      ? 'none'
      : pressed
      ? 'none'
      : '0 4px 14px rgba(0,122,255,0.3)',
    fontFamily: 'inherit',
  }

  return (
    <div style={cardStyle} onClick={() => textareaRef.current?.focus()}>
      <label style={labelStyle}>Your System</label>
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        placeholder="Describe your system: who are the players, what are they competing for, and what outcome do you want?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <div style={separatorStyle} />
      <div style={bottomBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={charCountStyle}>{charCount} chars</span>
          {charCount > 0 && charCount < 20 && (
            <span style={hintStyle}>min 20 to submit</span>
          )}
        </div>
        <button
          style={buttonStyle}
          onClick={handleSubmit}
          disabled={isDisabled}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
        >
          Design Mechanism →
        </button>
      </div>
    </div>
  )
}
