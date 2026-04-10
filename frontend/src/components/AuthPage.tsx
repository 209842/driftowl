import React, { useState } from 'react'

import { API } from '../config'

type AuthView = 'login' | 'register' | 'verify' | 'forgot' | 'reset'

function GraphDecoration() {
  const nodes = [
    { cx: 80, cy: 120 }, { cx: 220, cy: 60 }, { cx: 300, cy: 180 },
    { cx: 160, cy: 250 }, { cx: 60, cy: 310 }, { cx: 340, cy: 80 },
    { cx: 240, cy: 330 }, { cx: 120, cy: 200 },
  ]
  const edges = [[0,1],[1,2],[2,3],[3,4],[1,5],[2,6],[3,7],[0,7],[5,2],[6,3]]
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 420"
      style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}>
      {edges.map(([a,b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="white" strokeWidth={1} />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={i === 0 ? 14 : 7}
          fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
      ))}
    </svg>
  )
}

export default function AuthPage({ onAuth, onBack, initialMode = 'login', initialResetToken }: {
  onAuth: (token: string) => void
  onBack?: () => void
  initialMode?: 'login' | 'register'
  initialResetToken?: string
}) {
  const [view, setView]           = useState<AuthView>(initialResetToken ? 'reset' : initialMode)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [resetToken, setResetToken] = useState(initialResetToken ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [pendingToken, setPendingToken] = useState('')

  const clearMessages = () => { setError(''); setSuccess('') }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1px solid rgba(0,0,0,0.11)', borderRadius: 12,
    fontSize: 15, background: '#FAFAFA', color: '#0A0A0F',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#1C6EF3'; e.target.style.background = '#fff'
  }
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,0,0,0.11)'; e.target.style.background = '#FAFAFA'
  }

  const post = async (endpoint: string, body: object) => {
    const res  = await fetch(`${API}${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Something went wrong.')
    return data
  }

  // ── HANDLERS ──────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages()
    if (!firstName || !lastName)  { setError('Enter your first and last name.'); return }
    if (!email.includes('@'))     { setError('Enter a valid email.'); return }
    if (password.length < 6)      { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const data = await post('/auth/register', { email, password, first_name: firstName, last_name: lastName })
      localStorage.setItem('driftowl_token', data.token)
      localStorage.setItem('driftowl_user',  JSON.stringify(data.user))
      setPendingToken(data.token)
      setView('verify')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages()
    if (!email.includes('@'))  { setError('Enter a valid email.'); return }
    if (!password)             { setError('Enter your password.'); return }
    setLoading(true)
    try {
      const data = await post('/auth/login', { email, password })
      localStorage.setItem('driftowl_token', data.token)
      localStorage.setItem('driftowl_user',  JSON.stringify(data.user))
      onAuth(data.token)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages()
    if (verifyCode.length !== 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true)
    try {
      const token = pendingToken || localStorage.getItem('driftowl_token') || ''
      await fetch(`${API}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: verifyCode }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).detail) })
      onAuth(token)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleResendCode = async () => {
    clearMessages()
    const token = pendingToken || localStorage.getItem('driftowl_token') || ''
    try {
      await fetch(`${API}/auth/resend-verification`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Code resent! Check your email (or server console in dev).')
    } catch { setError('Could not resend code.') }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages()
    if (!email.includes('@')) { setError('Enter a valid email.'); return }
    setLoading(true)
    try {
      await post('/auth/forgot-password', { email })
      setSuccess('If this email exists, a reset link has been sent. Check your email (or server console in dev).')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages()
    if (!resetToken)          { setError('Enter the reset token.'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await post('/auth/reset-password', { token: resetToken, new_password: newPassword })
      setSuccess('Password updated! You can now log in.')
      setTimeout(() => { setView('login'); setSuccess('') }, 2000)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── LEFT PANEL copy per view ────────────────────────────────
  const leftCopy: Record<AuthView, { title: string; sub: string }> = {
    login:    { title: 'Design the rules.', sub: 'Watch the game play out.' },
    register: { title: 'Start building.', sub: 'Your first mechanism is one step away.' },
    verify:   { title: 'Almost there.', sub: 'Verify your email to unlock DriftOwl.' },
    forgot:   { title: 'No worries.', sub: "We'll get you back in." },
    reset:    { title: 'New password.', sub: 'Make it a good one.' },
  }
  const copy = leftCopy[view]

  // ── FORM CONTENT ────────────────────────────────────────────
  const renderForm = () => {
    if (view === 'verify') return (
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 0 }}>
          Check your email
        </h2>
        <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 8 }}>
          We sent a 6-digit code to <strong>{email}</strong>.<br />
          In dev mode, check the server console.
        </p>
        <input placeholder="000000" value={verifyCode} maxLength={6}
          onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
          style={{ ...inp, fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: 800 }}
          onFocus={focus} onBlur={blur} />
        {error   && <ErrorBox msg={error} />}
        {success && <SuccessBox msg={success} />}
        <SubmitBtn loading={loading} label="Verify email" />
        <button type="button" onClick={handleResendCode}
          style={{ background: 'none', border: 'none', fontSize: 13, color: '#1C6EF3', cursor: 'pointer' }}>
          Resend code
        </button>
        <button type="button" onClick={() => onAuth(pendingToken || localStorage.getItem('driftowl_token') || '')}
          style={{ background: 'none', border: 'none', fontSize: 13, color: '#AEAEB2', cursor: 'pointer' }}>
          Skip for now →
        </button>
      </form>
    )

    if (view === 'forgot') return (
      <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 0 }}>
          Forgot password?
        </h2>
        <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 8 }}>
          Enter your email and we'll send a reset link.
        </p>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
        {error   && <ErrorBox msg={error} />}
        {success && <SuccessBox msg={success} />}
        <SubmitBtn loading={loading} label="Send reset link" />
        <button type="button" onClick={() => { setView('login'); clearMessages() }}
          style={{ background: 'none', border: 'none', fontSize: 13, color: '#8A8A8E', cursor: 'pointer' }}>
          ← Back to login
        </button>
      </form>
    )

    if (view === 'reset') return (
      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 0 }}>
          Reset password
        </h2>
        <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 8 }}>
          {initialResetToken ? 'Choose a new password for your account.' : 'Paste the token from your email, then set a new password.'}
        </p>
        {!initialResetToken && (
          <input placeholder="Reset token" value={resetToken}
            onChange={e => setResetToken(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
        )}
        <input type="password" placeholder="New password (min 6 chars)" value={newPassword}
          onChange={e => setNewPassword(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
        {error   && <ErrorBox msg={error} />}
        {success && <SuccessBox msg={success} />}
        <SubmitBtn loading={loading} label="Set new password" />
      </form>
    )

    if (view === 'register') return (
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 0 }}>
          Create an account
        </h2>
        <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 8 }}>
          Already have an account?{' '}
          <Lnk onClick={() => { setView('login'); clearMessages() }}>Log in</Lnk>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
          <input placeholder="Last name"  value={lastName}  onChange={e => setLastName(e.target.value)}  style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
        <PwInput value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw(v => !v)} inp={inp} focus={focus} blur={blur} />
        {error && <ErrorBox msg={error} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" required id="terms" style={{ width: 15, height: 15, accentColor: '#1C6EF3' }} />
          <label htmlFor="terms" style={{ fontSize: 13, color: '#6E6E73' }}>
            I agree to the <Lnk>Terms & Conditions</Lnk>
          </label>
        </div>
        <SubmitBtn loading={loading} label="Create account" />
        <Divider />
        <OAuthButtons onAuth={onAuth} />
      </form>
    )

    // login (default)
    return (
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7, color: '#0A0A0F', marginBottom: 0 }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 8 }}>
          Don't have an account?{' '}
          <Lnk onClick={() => { setView('register'); clearMessages() }}>Sign up</Lnk>
        </p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
        <PwInput value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw(v => !v)} inp={inp} focus={focus} blur={blur} />
        <div style={{ textAlign: 'right' }}>
          <Lnk onClick={() => { setView('forgot'); clearMessages() }}>Forgot password?</Lnk>
        </div>
        {error && <ErrorBox msg={error} />}
        <SubmitBtn loading={loading} label="Log in" />
        <Divider />
        <OAuthButtons onAuth={onAuth} />
      </form>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* LEFT */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(150deg, #0c1220 0%, #151d35 50%, #0e1623 100%)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '36px 44px',
      }}>
        <GraphDecoration />
        <div style={{ position: 'relative', zIndex: 1, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.4 }}>
          DriftOwl
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: -1, marginBottom: 14 }}>
            {copy.title}<br />
            <span style={{ color: 'rgba(255,255,255,0.38)' }}>{copy.sub}</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.7 }}>
            Mechanism Design Intelligence<br />powered by multi-agent AI and game theory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 1 }}>
          {[24, 6, 6].map((w, i) => (
            <div key={i} style={{ width: w, height: 5, borderRadius: 3, background: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        flex: 1, background: '#F6F8FC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 56px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, color: '#8A8A8E', fontWeight: 500,
              padding: 0, marginBottom: 40,
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#0A0A0F'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A8A8E'}
            >← Back to home</button>
          )}
          {renderForm()}
        </div>
      </div>
    </div>
  )
}

// ── SMALL SHARED COMPONENTS ───────────────────────────────────

function Lnk({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', color: '#1C6EF3',
      fontSize: 'inherit', cursor: 'pointer', fontWeight: 600, padding: 0,
    }}>{children}</button>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      fontSize: 13, color: '#EF4444',
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)',
      borderRadius: 10, padding: '10px 14px',
    }}>{msg}</div>
  )
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div style={{
      fontSize: 13, color: '#10B981',
      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)',
      borderRadius: 10, padding: '10px 14px',
    }}>{msg}</div>
  )
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', padding: '14px', borderRadius: 12, border: 'none',
      background: '#1C6EF3', color: '#fff',
      fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
      letterSpacing: -0.2, marginTop: 4, transition: 'opacity 0.15s, transform 0.15s',
      opacity: loading ? 0.7 : 1,
    }}
      onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >{loading ? '…' : label}</button>
  )
}

function PwInput({ value, onChange, show, toggle, inp, focus, blur }: any) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} placeholder="Password" value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 44 }} onFocus={focus} onBlur={blur} />
      <button type="button" onClick={toggle} style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 15, color: '#AEAEB2', padding: 0, lineHeight: 1,
      }}>{show ? '○' : '●'}</button>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
      <span style={{ fontSize: 12, color: '#AEAEB2' }}>or continue with</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
    </div>
  )
}

function OAuthButtons({ onAuth }: { onAuth: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[
        { label: 'Google', icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
        { label: 'Apple',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A0A0F"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg> },
      ].map(p => (
        <button key={p.label} type="button" onClick={() => onAuth('oauth-mock')} style={{
          flex: 1, padding: '11px', borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.10)', background: '#fff',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0A0A0F',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F2F5'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
        >{p.icon} {p.label}</button>
      ))}
    </div>
  )
}
