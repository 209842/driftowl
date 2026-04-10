import React, { useState, useEffect } from 'react'

import { API } from '../config'

function getToken() { return localStorage.getItem('driftowl_token') || '' }
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

// ── Small UI primitives ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#8A8A8E', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 }}>
      {children}
    </h3>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3C3C43', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder = '' }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 14px', borderRadius: 10,
        border: '1.5px solid rgba(0,0,0,0.10)',
        background: '#fff', fontSize: 14, color: '#0A0A0F',
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  )
}

function SaveBtn({ onClick, loading, label = 'Save changes' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: '10px 22px', borderRadius: 10,
      background: loading ? '#A0AEC0' : '#1C6EF3', border: 'none',
      color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
    }}>{loading ? 'Saving…' : label}</button>
  )
}

function Notice({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, marginTop: 12,
      background: type === 'success' ? '#ECFDF5' : '#FFF1F2',
      color: type === 'success' ? '#065F46' : '#9B1C1C',
      fontSize: 13, fontWeight: 500,
    }}>{children}</div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
        background: checked ? '#1C6EF3' : '#D1D1D6', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ── Section: Profile ───────────────────────────────────────────────────────

function ProfileSection({ user, onUserUpdate }: { user: any; onUserUpdate: (u: any) => void }) {
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName]   = useState(user?.last_name || '')
  const [loading, setLoading]     = useState(false)
  const [notice, setNotice]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setNotice({ type: 'error', msg: 'Name fields cannot be empty.' }); return
    }
    setLoading(true); setNotice(null)
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      })
      if (!res.ok) throw new Error((await res.json()).detail)
      const updated = await res.json()
      localStorage.setItem('driftowl_user', JSON.stringify(updated))
      onUserUpdate(updated)
      setNotice({ type: 'success', msg: 'Profile updated successfully.' })
    } catch (e: any) {
      setNotice({ type: 'error', msg: e.message || 'Something went wrong.' })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <SectionTitle>Personal information</SectionTitle>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff',
        }}>{firstName[0]?.toUpperCase() || '?'}</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0F', margin: 0 }}>{firstName} {lastName}</p>
          <p style={{ fontSize: 13, color: '#8A8A8E', margin: '2px 0 0' }}>{user?.email}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <Field label="First name">
          <Input value={firstName} onChange={setFirstName} placeholder="First name" />
        </Field>
        <Field label="Last name">
          <Input value={lastName} onChange={setLastName} placeholder="Last name" />
        </Field>
      </div>

      <Field label="Email address">
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          border: '1.5px solid rgba(0,0,0,0.08)', background: '#F6F8FC',
          fontSize: 14, color: '#8A8A8E',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{user?.email}</span>
          {user?.email_verified
            ? <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', background: '#ECFDF5', padding: '2px 8px', borderRadius: 20 }}>Verified</span>
            : <span style={{ fontSize: 11, fontWeight: 700, color: '#9B1C1C', background: '#FFF1F2', padding: '2px 8px', borderRadius: 20 }}>Not verified</span>
          }
        </div>
      </Field>

      <SaveBtn onClick={save} loading={loading} />
      {notice && <Notice type={notice.type}>{notice.msg}</Notice>}
    </div>
  )
}

// ── Section: Security ──────────────────────────────────────────────────────

function SecuritySection() {
  const [current, setCurrent]   = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [notice, setNotice]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const save = async () => {
    if (!current || !newPw || !confirm) {
      setNotice({ type: 'error', msg: 'Please fill in all fields.' }); return
    }
    if (newPw !== confirm) {
      setNotice({ type: 'error', msg: 'New passwords do not match.' }); return
    }
    if (newPw.length < 6) {
      setNotice({ type: 'error', msg: 'Password must be at least 6 characters.' }); return
    }
    setLoading(true); setNotice(null)
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ current_password: current, new_password: newPw }),
      })
      if (!res.ok) throw new Error((await res.json()).detail)
      setCurrent(''); setNewPw(''); setConfirm('')
      setNotice({ type: 'success', msg: 'Password changed. You will need to log in again next time.' })
    } catch (e: any) {
      setNotice({ type: 'error', msg: e.message || 'Something went wrong.' })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <SectionTitle>Change password</SectionTitle>
      <Field label="Current password">
        <Input value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
      </Field>
      <Field label="New password">
        <Input value={newPw} onChange={setNewPw} type="password" placeholder="Min. 6 characters" />
      </Field>
      <Field label="Confirm new password">
        <Input value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
      </Field>
      <SaveBtn onClick={save} loading={loading} label="Change password" />
      {notice && <Notice type={notice.type}>{notice.msg}</Notice>}
    </div>
  )
}

// ── Section: Email & Notifications ────────────────────────────────────────

function NotificationsSection({ user }: { user: any }) {
  return (
    <div>
      <SectionTitle>Email & notifications</SectionTitle>

      <div style={{
        background: '#fff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Analysis complete', desc: 'When your mechanism analysis finishes', checked: true },
          { label: 'Weekly summary', desc: 'A recap of your recent analyses', checked: false },
          { label: 'Product updates', desc: 'New features and improvements', checked: true },
        ].map((item, i) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0A0A0F' }}>{item.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8A8A8E' }}>{item.desc}</p>
            </div>
            <Toggle checked={item.checked} onChange={() => {}} />
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#AEAEB2', marginTop: 12 }}>
        Emails are sent to <strong>{user?.email}</strong>
        {!user?.email_verified && ' — please verify your email address first.'}
      </p>
    </div>
  )
}

// ── Section: History ──────────────────────────────────────────────────────

function HistorySection({ user, onUserUpdate }: { user: any; onUserUpdate: (u: any) => void }) {
  const [saveHistory, setSaveHistory] = useState<boolean>(user?.save_history !== false)
  const [loading, setLoading]         = useState(false)
  const [notice, setNotice]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [confirmOff, setConfirmOff]   = useState(false)

  const toggle = async (value: boolean) => {
    if (!value && !confirmOff) {
      setConfirmOff(true); return
    }
    setConfirmOff(false)
    setLoading(true); setNotice(null)
    try {
      const res = await fetch(`${API}/auth/preferences`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ save_history: value }),
      })
      if (!res.ok) throw new Error('Failed to update preferences.')
      setSaveHistory(value)
      const updatedUser = { ...user, save_history: value }
      localStorage.setItem('driftowl_user', JSON.stringify(updatedUser))
      onUserUpdate(updatedUser)
      setNotice({
        type: 'success',
        msg: value ? 'History tracking enabled.' : 'History disabled. All previous analyses have been deleted.',
      })
    } catch (e: any) {
      setNotice({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <div>
      <SectionTitle>Analysis history</SectionTitle>

      <div style={{
        background: '#fff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.07)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0A0A0F' }}>Save analysis history</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8A8A8E', lineHeight: 1.5 }}>
              When enabled, all your analyses (mechanisms, simulations, papers) are saved to your account
              and accessible from the dashboard. Disabling this will permanently delete all existing history.
            </p>
          </div>
          <Toggle checked={saveHistory} onChange={toggle} />
        </div>

        {confirmOff && (
          <div style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 10,
            background: '#FFF7ED', border: '1px solid #FED7AA',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#92400E' }}>
              This will permanently delete all your saved analyses. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggle(false)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>Yes, delete everything</button>
              <button onClick={() => setConfirmOff(false)} style={{
                padding: '7px 16px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#fff', color: '#3C3C43', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {loading && <p style={{ fontSize: 13, color: '#8A8A8E', marginTop: 8 }}>Updating…</p>}
      {notice && <Notice type={notice.type}>{notice.msg}</Notice>}
    </div>
  )
}

// ── Section: Danger Zone ──────────────────────────────────────────────────

function DangerSection({ onLogout }: { onLogout: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const deleteAccount = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/account`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete account.')
      localStorage.removeItem('driftowl_token')
      localStorage.removeItem('driftowl_user')
      onLogout()
    } catch (e: any) {
      setNotice({ type: 'error', msg: e.message })
      setLoading(false)
    }
  }

  return (
    <div>
      <SectionTitle>Danger zone</SectionTitle>

      <div style={{
        borderRadius: 14, border: '1.5px solid #FECACA',
        background: '#FFF1F2', padding: '20px',
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0A0A0F' }}>
          Delete account
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8A8A8E', lineHeight: 1.5 }}>
          Permanently delete your account and all associated data including analyses, papers and simulations.
          This action cannot be undone.
        </p>

        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{
            padding: '9px 20px', borderRadius: 9, border: '1.5px solid #DC2626',
            background: 'transparent', color: '#DC2626',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>Delete my account</button>
        ) : (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#9B1C1C', marginBottom: 10 }}>
              Are you absolutely sure? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deleteAccount} disabled={loading} style={{
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: '#DC2626', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              }}>{loading ? 'Deleting…' : 'Yes, delete everything'}</button>
              <button onClick={() => setConfirm(false)} style={{
                padding: '9px 20px', borderRadius: 9,
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#fff', color: '#3C3C43', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {notice && <Notice type={notice.type}>{notice.msg}</Notice>}
    </div>
  )
}

// ── Main SettingsPage ─────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile' },
  { id: 'security',      label: 'Security' },
  { id: 'notifications', label: 'Email & Notifications' },
  { id: 'history',       label: 'History' },
  { id: 'danger',        label: 'Account' },
]

export default function SettingsPage({ onBack, onLogout }: {
  onBack: () => void
  onLogout: () => void
}) {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('driftowl_user') || '{}') } catch { return {} }
  })

  // Sync user from server on mount
  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) { setUser(u); localStorage.setItem('driftowl_user', JSON.stringify(u)) } })
      .catch(() => {})
  }, [])

  const handleUserUpdate = (u: any) => setUser(u)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F6F8FC' }}>

      {/* ── NAVBAR ── */}
      <div style={{
        padding: '0 40px', height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(246,248,252,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#8A8A8E', display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 0',
          }}>
            <span style={{ fontSize: 15 }}>←</span> Back to dashboard
          </button>
          <span style={{ color: 'rgba(0,0,0,0.12)', fontSize: 16 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#0A0A0F' }}>DriftOwl</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1C6EF3, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>{user?.first_name?.[0]?.toUpperCase() || '?'}</div>
          <span style={{ fontSize: 13, color: '#3C3C43', fontWeight: 500 }}>{user?.first_name || 'User'}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: '#0A0A0F', marginBottom: 4 }}>Account settings</h1>
          <p style={{ fontSize: 14, color: '#8A8A8E', marginBottom: 32 }}>Manage your profile, security and preferences.</p>

          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

            {/* Sidebar */}
            <div style={{ width: 200, flexShrink: 0 }}>
              <nav style={{
                background: '#fff', borderRadius: 14,
                border: '1.5px solid rgba(0,0,0,0.07)',
                overflow: 'hidden',
              }}>
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '12px 16px', border: 'none', cursor: 'pointer',
                      borderBottom: i < TABS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      background: activeTab === tab.id ? 'rgba(28,110,243,0.06)' : 'transparent',
                      color: activeTab === tab.id
                        ? (tab.id === 'danger' ? '#DC2626' : '#1C6EF3')
                        : (tab.id === 'danger' ? '#DC2626' : '#3C3C43'),
                      fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                      textAlign: 'left',
                    } as React.CSSProperties}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content panel */}
            <div style={{
              flex: 1, background: '#fff', borderRadius: 16,
              border: '1.5px solid rgba(0,0,0,0.07)',
              padding: '28px 32px',
              minHeight: 400,
            }}>
              {activeTab === 'profile'       && <ProfileSection user={user} onUserUpdate={handleUserUpdate} />}
              {activeTab === 'security'      && <SecuritySection />}
              {activeTab === 'notifications' && <NotificationsSection user={user} />}
              {activeTab === 'history'       && <HistorySection user={user} onUserUpdate={handleUserUpdate} />}
              {activeTab === 'danger'        && <DangerSection onLogout={onLogout} />}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
