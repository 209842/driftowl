import React, { useState, useEffect, Component, ReactNode } from 'react'
import { Mode, AppScreen } from './types'
import { API } from './config'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import ModeSelector from './components/ModeSelector'
import Boardroom from './components/Boardroom'
import SettingsPage from './components/SettingsPage'
import LibraryPage from './components/LibraryPage'
import AnalysisDetailPage from './components/AnalysisDetailPage'

class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0A0A0F', color: '#fff', padding: 40
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Rendering error</div>
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: 20, maxWidth: 600, width: '100%',
            fontFamily: 'monospace', fontSize: 12, color: '#EF4444',
            marginBottom: 24, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </div>
          <button onClick={() => { this.setState({ error: null }); this.props.onReset() }} style={{
            background: '#1C6EF3', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            Back to start
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [mode, setMode] = useState<Mode>('company')
  const [context, setContext] = useState('')
  const [problem, setProblem] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [activePill, setActivePill] = useState<any>(null)
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null)

  // On mount: restore session if valid token exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resetTok = params.get('token')

    if (resetTok && window.location.pathname.includes('reset-password')) {
      // Password reset link — go to auth/reset
      setResetToken(resetTok)
      setScreen('auth')
      window.history.replaceState({}, '', '/')
      return
    }

    // Check for existing valid session
    const savedToken = localStorage.getItem('driftowl_token')
    if (savedToken) {
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(user => {
          if (user) {
            localStorage.setItem('driftowl_user', JSON.stringify(user))
            setScreen('mode')
          } else {
            // Token expired — clear and stay on landing
            localStorage.removeItem('driftowl_token')
            localStorage.removeItem('driftowl_user')
          }
        })
        .catch(() => { /* network error — stay on landing */ })
    }
  }, [])

  // Handle reset-password link: ?token=xxx (legacy, kept for safety)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token && window.location.pathname.includes('reset-password')) {
      setResetToken(token)
      setScreen('auth')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const goToAuth = (m: 'login' | 'register') => {
    setAuthMode(m)
    setScreen('auth')
  }

  const handleAuth = (_token: string) => setScreen('mode')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('driftowl_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const handleStart = async (ctx: string, prob: string) => {
    setContext(ctx)
    setProblem(prob)
    const res = await fetch(`${API}/session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        mode: 'auto', context: ctx, problem: prob,
        pill: activePill ? {
          mechanism_name: activePill.mechanism_name,
          core_rules: activePill.core_rules,
          key_conditions: activePill.key_conditions,
          why_it_works: activePill.why_it_works,
        } : null,
      })
    })
    const data = await res.json()
    setSessionId(data.session_id)
    setMode(data.detected_mode || 'company')
    setActivePill(null)
    setScreen('boardroom')
  }

  const handleReset = () => {
    setScreen('mode')
    setSessionId(null)
    setContext('')
    setProblem('')
    setMode('company')
  }

  // key forces remount → CSS animation replays on every screen change
  return (
    <div className="app-bg" style={{ overflow: screen === 'landing' ? 'hidden' : 'hidden' }}>
      <div key={screen} className="screen">
        {screen === 'landing' && (
          <LandingPage
            onGetStarted={() => goToAuth('register')}
            onLogin={() => goToAuth('login')}
            onRegister={() => goToAuth('register')}
          />
        )}
        {screen === 'auth' && (
          <AuthPage
            onAuth={handleAuth}
            onBack={() => setScreen('landing')}
            initialMode={authMode}
            initialResetToken={resetToken ?? undefined}
          />
        )}
        {screen === 'mode' && (
          <ModeSelector
            onStart={handleStart}
            onBack={() => { localStorage.removeItem('driftowl_token'); localStorage.removeItem('driftowl_user'); setScreen('landing') }}
            onSettings={() => setScreen('settings')}
            onLibrary={() => setScreen('library')}
            onOpenAnalysis={(id) => { setActiveAnalysisId(id); setScreen('analysis') }}
            suggestedPill={activePill}
            onClearPill={() => setActivePill(null)}
          />
        )}
        {screen === 'settings' && (
          <SettingsPage
            onBack={() => setScreen('mode')}
            onLogout={() => setScreen('landing')}
          />
        )}
        {screen === 'analysis' && activeAnalysisId && (
          <AnalysisDetailPage
            analysisId={activeAnalysisId}
            onBack={() => setScreen('mode')}
          />
        )}
        {screen === 'library' && (
          <LibraryPage
            onBack={() => setScreen('mode')}
            onUsePill={(pill) => {
              setActivePill(pill)
              setScreen('mode')
            }}
          />
        )}
        {screen === 'boardroom' && sessionId && (
          <ErrorBoundary onReset={handleReset}>
            <Boardroom sessionId={sessionId} mode={mode} problem={problem} onReset={handleReset} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
