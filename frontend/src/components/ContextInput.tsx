import React, { useState } from 'react'
import { Mode } from '../types'

const MODE_LABELS: Record<Mode, string> = {
  company:    'Company',
  platform:   'Platform',
  dao:        'DAO',
  government: 'Government',
}

export default function ContextInput({ mode, onStart, onBack, suggestedPill, onClearPill }: {
  mode: Mode
  onStart: (context: string, problem: string) => void
  onBack: () => void
  suggestedPill?: any
  onClearPill?: () => void
}) {
  const [context, setContext] = useState('')
  const [problem, setProblem] = useState('')
  const canStart = context.length >= 20 && problem.length >= 20

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <div style={{
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(246,248,252,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, color: '#0A0A0F' }}>DriftOwl</span>
          <span style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)' }} />
          <span style={{ fontSize: 13, color: '#8A8A8E', fontWeight: 500 }}>{MODE_LABELS[mode]}</span>
        </div>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 8, padding: '6px 14px',
          fontSize: 13, color: '#6E6E73', cursor: 'pointer', fontWeight: 500,
        }}>← Back</button>
      </div>

      {/* Pill banner */}
      {suggestedPill && (
        <div style={{
          margin: '12px 40px 0',
          padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(28,110,243,0.07), rgba(79,70,229,0.07))',
          border: '1.5px solid rgba(28,110,243,0.18)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1C6EF3', letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Starting from library pill
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#0A0A0F' }}>
              {suggestedPill.mechanism_name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B6B70' }}>
              {suggestedPill.abstract_pattern}
            </p>
          </div>
          <button onClick={onClearPill} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#AEAEB2', flexShrink: 0, padding: '4px',
          }}>×</button>
        </div>
      )}

      {/* Form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 620 }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 2.5,
              color: '#1C6EF3', textTransform: 'uppercase', marginBottom: 10,
            }}>
              {MODE_LABELS[mode]}
            </div>
            <h2 style={{
              fontSize: 32, fontWeight: 800, letterSpacing: -1,
              color: '#0A0A0F', lineHeight: 1.1,
            }}>
              Describe your system
            </h2>
          </div>

          {[
            {
              label: 'CONTEXT',
              value: context,
              onChange: setContext,
              placeholder: 'Describe your organization, team size, current structure, existing incentives…',
            },
            {
              label: 'THE PROBLEM',
              value: problem,
              onChange: setProblem,
              placeholder: 'What behavior do you want to change? What outcome are you looking for?',
            },
          ].map(field => (
            <div key={field.label} style={{
              background: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 18, padding: '18px 22px',
              marginBottom: 12,
              backdropFilter: 'blur(20px)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onFocus={() => {}}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: '#AEAEB2', textTransform: 'uppercase', marginBottom: 10,
              }}>
                {field.label}
              </div>
              <textarea
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 16, color: '#0A0A0F', resize: 'none', fontFamily: 'inherit',
                  letterSpacing: -0.2, lineHeight: 1.6,
                }}
              />
              <div style={{
                fontSize: 12, color: field.value.length >= 20 ? '#34C759' : '#AEAEB2',
                marginTop: 6, textAlign: 'right', transition: 'color 0.2s',
              }}>
                {field.value.length}/20 min
              </div>
            </div>
          ))}

          <button
            onClick={() => onStart(context, problem)}
            disabled={!canStart}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: canStart
                ? 'linear-gradient(135deg, #1C6EF3 0%, #4F46E5 100%)'
                : 'rgba(0,0,0,0.07)',
              color: canStart ? '#fff' : '#AEAEB2',
              fontSize: 16, fontWeight: 700,
              cursor: canStart ? 'pointer' : 'not-allowed',
              marginTop: 8, letterSpacing: -0.3,
              transition: 'all 0.2s ease',
              boxShadow: canStart ? '0 4px 20px rgba(28,110,243,0.25)' : 'none',
            }}
            onMouseEnter={e => { if (canStart) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            Launch Analysis →
          </button>
        </div>
      </div>
    </div>
  )
}
