'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  type: ToastType
  message: string
  closing?: boolean
}

type NotificationContextValue = {
  notify: (payload: { type?: ToastType; message: string }) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const playToastSound = useCallback((type: ToastType) => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const freq = type === 'success' ? 880 : type === 'error' ? 320 : 520
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.26)
      setTimeout(() => ctx.close(), 400)
    } catch {}
  }, [])

  const notify = useCallback(({ type = 'info', message }: { type?: ToastType; message: string }) => {
    const id = Math.random().toString(36).slice(2)
    // jouer un son discret
    playToastSound(type)
    setToasts(prev => [...prev, { id, type, message, closing: false }])
    // Durée d'affichage 5s puis animation de sortie
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, closing: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 280)
    }, 5000)
  }, [playToastSound])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'grid', gap: 10, zIndex: 9999, alignContent: 'end', justifyItems: 'end' }}>
        {toasts.map((t, i) => (
          <div key={t.id} style={{
            position: 'relative',
            minWidth: 260,
            maxWidth: 420,
            padding: '10px 36px 10px 12px',
            borderRadius: 10,
            color: '#fff',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#2563eb',
            animation: `${t.closing ? 'lt_toast_out' : 'lt_toast_in'} 280ms ease forwards`,
            animationDelay: t.closing ? '0ms' : `${i * 60}ms`,
            // Décalage horizontal configurable via CSS var utilisée par les keyframes
            // @ts-ignore - CSS custom properties
            ['--lt-toast-x' as any]: `${i * 2}px`
          }}>
            {t.message}
            <button
              onClick={() => {
                setToasts(prev => prev.map(x => x.id === t.id ? { ...x, closing: true } : x))
                setTimeout(() => {
                  setToasts(prev => prev.filter(x => x.id !== t.id))
                }, 280)
              }}
              aria-label="Fermer la notification"
              style={{ position: 'absolute', top: 6, right: 8, background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}


