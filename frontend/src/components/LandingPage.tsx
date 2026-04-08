import React, { useRef } from 'react'

const steps = [
  {
    num: '01',
    title: 'Describe your system',
    desc: 'Tell DriftOwl about your organization and the coordination problem you face — in plain language. No game theory required.',
    tag: 'Natural Language Input',
  },
  {
    num: '02',
    title: '25+ AI experts analyze it',
    desc: 'A boardroom of specialized agents — game theorists, behavioral economists, sociologists, neuroscientists — debate the problem in parallel and build on each other\'s insights.',
    tag: 'Multi-Agent AI',
  },
  {
    num: '03',
    title: 'A mechanism is designed',
    desc: 'The system synthesizes all expert views into a concrete, implementable incentive mechanism with mathematically verified properties: incentive-compatible, individually rational, efficient.',
    tag: 'Mechanism Synthesis',
  },
  {
    num: '04',
    title: 'Test it in a virtual society',
    desc: 'Real-feeling personas from your context are simulated over 7 rounds. Watch who complies, who resists, and how the mechanism adapts. See compliance rates evolve in real time.',
    tag: 'Agent-Based Simulation',
  },
  {
    num: '05',
    title: 'Get a research paper',
    desc: 'DriftOwl auto-generates a complete academic paper documenting your mechanism design study — ready to share, publish, or pitch to investors.',
    tag: 'Auto-Generated Research',
  },
]

const useCases = [
  { label: 'Sales teams that compete instead of collaborate', icon: '⚔️' },
  { label: 'Platforms struggling with low-quality content', icon: '📉' },
  { label: 'DAOs where whales dominate voting', icon: '🐳' },
  { label: 'Governments designing fair public policy', icon: '⚖️' },
]

export default function LandingPage({ onGetStarted, onLogin, onRegister }: {
  onGetStarted: () => void
  onLogin: () => void
  onRegister: () => void
}) {
  const howRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px 60px',
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* bg orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '10%', left: '5%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(190,215,255,0.14) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', right: '3%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(175,230,255,0.10) 0%, transparent 70%)',
          }} />
        </div>

        {/* Nav */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '16px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(246,248,252,0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, color: '#0A0A0F' }}>DriftOwl</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'none', border: 'none', fontSize: 14, color: '#6E6E73',
                cursor: 'pointer', fontWeight: 500, padding: '8px 4px',
              }}
            >
              How it works
            </button>
            <button
              onClick={onLogin}
              style={{
                padding: '8px 18px', borderRadius: 10,
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.12)',
                color: '#0A0A0F', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Accedi
            </button>
            <button
              onClick={onRegister}
              style={{
                padding: '8px 18px', borderRadius: 10,
                background: '#0A0A0F', border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Registrati
            </button>
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.80)',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 100, padding: '6px 16px',
          marginBottom: 40,
          animation: 'fadeInUp 0.5s ease both',
          backdropFilter: 'blur(20px)',
        }}>
          <span style={{ fontSize: 12, color: '#1C6EF3', fontWeight: 600 }}>NEW</span>
          <span style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)' }} />
          <span style={{ fontSize: 12, color: '#6E6E73' }}>Game theory meets generative AI</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(52px, 9vw, 100px)',
          fontWeight: 800,
          letterSpacing: '-3px',
          color: '#0A0A0F',
          lineHeight: 0.95,
          marginBottom: 24,
          animation: 'fadeInUp 0.5s 0.08s ease both',
        }}>
          DriftOwl
        </h1>

        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '3.5px',
          color: '#8A8A8E', textTransform: 'uppercase',
          marginBottom: 32, animation: 'fadeInUp 0.5s 0.14s ease both',
        }}>
          Mechanism Design Intelligence
        </div>

        <p style={{
          fontSize: 18, color: '#3C3C43', maxWidth: 500,
          lineHeight: 1.65, marginBottom: 48,
          animation: 'fadeInUp 0.5s 0.20s ease both',
        }}>
          Design the incentive rules of any competitive system.{' '}
          <strong style={{ color: '#0A0A0F' }}>Watch the game play out.</strong>
        </p>

        {/* CTA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          animation: 'fadeInUp 0.5s 0.28s ease both',
        }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '16px 48px', borderRadius: 14,
              background: '#0A0A0F', border: 'none',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: -0.3,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.20)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)'
            }}
          >
            Get started free →
          </button>
          <span style={{ fontSize: 13, color: '#AEAEB2' }}>No credit card required</span>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          animation: 'fadeInUp 0.5s 0.5s ease both',
          cursor: 'pointer',
        }} onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <span style={{ fontSize: 11, color: '#AEAEB2', letterSpacing: 1.5, textTransform: 'uppercase' }}>Scroll</span>
          <div style={{
            width: 1, height: 32,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)',
          }} />
        </div>
      </div>

      {/* ── USE CASES ── */}
      <div style={{
        padding: '80px 40px',
        background: 'rgba(255,255,255,0.6)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 2.5, color: '#8A8A8E',
            textTransform: 'uppercase', marginBottom: 16, textAlign: 'center',
          }}>
            Built for systems that need better rules
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
          }}>
            {useCases.map((u, i) => (
              <div key={i} style={{
                padding: '20px 24px', borderRadius: 16,
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>{u.icon}</span>
                <span style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.5, fontWeight: 500 }}>{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div ref={howRef} style={{ padding: '100px 40px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 2.5, color: '#1C6EF3',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            How it works
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, color: '#0A0A0F', lineHeight: 1.1 }}>
            From problem to mechanism<br />in minutes
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 32, alignItems: 'flex-start',
              paddingBottom: i < steps.length - 1 ? 48 : 0,
              position: 'relative',
            }}>
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', left: 20, top: 44, bottom: 0, width: 1,
                  background: 'linear-gradient(to bottom, rgba(28,110,243,0.15), rgba(28,110,243,0.03))',
                }} />
              )}

              {/* Step number */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(28,110,243,0.07)',
                border: '1px solid rgba(28,110,243,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#1C6EF3',
                zIndex: 1,
              }}>
                {step.num}
              </div>

              <div style={{ paddingTop: 8 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: '#8A8A8E',
                  textTransform: 'uppercase', marginBottom: 6,
                }}>
                  {step.tag}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0F', marginBottom: 8, letterSpacing: -0.4 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: '#6E6E73', lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{
        padding: '100px 40px',
        textAlign: 'center',
        background: '#0A0A0F',
      }}>
        <h2 style={{
          fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800,
          letterSpacing: -2, color: '#fff', lineHeight: 1.05, marginBottom: 20,
        }}>
          Design better systems.<br />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Starting today.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
          Join researchers, founders, and policymakers using DriftOwl.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            padding: '16px 48px', borderRadius: 14,
            background: '#fff', border: 'none',
            color: '#0A0A0F', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', letterSpacing: -0.3,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
        >
          Get started free →
        </button>
        <div style={{ marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
          © 2026 DRIFTOWL · MECHANISM DESIGN INTELLIGENCE · FOUNDED BY ENRICO SAGLIMBENI
        </div>
      </div>

    </div>
  )
}
