import React, { useState, useEffect } from 'react'
import { Mode, AppScreen } from './types'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import ModeSelector from './components/ModeSelector'
import ContextInput from './components/ContextInput'
import Boardroom from './components/Boardroom'
import SettingsPage from './components/SettingsPage'
import LibraryPage from './components/LibraryPage'
import AnalysisDetailPage from './components/AnalysisDetailPage'

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
      fetch('http://localhost:8000/auth/me', {
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

  const handleModeSelect = (m: Mode) => {
    setMode(m)
    setScreen('input')
  }

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
    const res = await fetch('http://localhost:8000/session', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        mode, context: ctx, problem: prob,
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
    setActivePill(null)
    setScreen('boardroom')
  }

  const handleReset = () => {
    setScreen('mode')
    setSessionId(null)
    setContext('')
    setProblem('')
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
            onSelect={handleModeSelect}
            onBack={() => setScreen('landing')}
            onSettings={() => setScreen('settings')}
            onLibrary={() => setScreen('library')}
            onOpenAnalysis={(id) => { setActiveAnalysisId(id); setScreen('analysis') }}
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
              setScreen('input')
            }}
          />
        )}
        {screen === 'input' && (
          <ContextInput
            mode={mode}
            onStart={handleStart}
            onBack={() => setScreen('mode')}
            suggestedPill={activePill}
            onClearPill={() => setActivePill(null)}
          />
        )}
        {screen === 'boardroom' && sessionId && (
          <Boardroom sessionId={sessionId} mode={mode} problem={problem} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
