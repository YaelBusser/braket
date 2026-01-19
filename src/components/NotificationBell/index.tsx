'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './index.module.scss'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?unreadOnly=false&limit=20')
        const data = await res.json()
        if (res.ok) {
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true })
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic de déclencher handleNotificationClick
    try {
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        // Mettre à jour le compteur si la notification était non lue
        const deletedNotification = notifications.find(n => n.id === notificationId)
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  if (!session?.user) return null

  return (
    <div className={styles.notificationBell} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllRead}
                onClick={markAllAsRead}
                disabled={loading}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>{notification.title}</div>
                    <div className={styles.notificationMessage}>{notification.message}</div>
                    <div className={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={styles.notificationActions}>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => deleteNotification(notification.id, e)}
                      aria-label="Supprimer la notification"
                    >
                      ×
                    </button>
                    {!notification.read && <div className={styles.unreadDot} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
