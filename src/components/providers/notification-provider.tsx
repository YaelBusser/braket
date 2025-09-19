'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  type: ToastType
  message: string
}

type NotificationContextValue = {
  notify: (payload: { type?: ToastType; message: string }) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback(({ type = 'info', message }: { type?: ToastType; message: string }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'grid', gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            minWidth: 260,
            maxWidth: 420,
            padding: '10px 12px',
            borderRadius: 10,
            color: '#fff',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#2563eb'
          }}>
            {t.message}
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


