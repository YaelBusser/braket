'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '../providers/theme-provider'
import SettingsIcon from '../icons/SettingsIcon'
import styles from './index.module.scss'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut({ callbackUrl: '/' })
  }

  const handleProfileClick = () => {
    setIsOpen(false)
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    setIsOpen(false)
    router.push('/settings')
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
      >
        {session.user?.image ? (
          <span className={styles.profileAvatar}>
            <img src={session.user.image} alt="Avatar" className={styles.profileAvatarImg} />
          </span>
        ) : (
          <span className={styles.profileAvatarPlaceholder}>
            {(session.user?.name || 'P')?.charAt(0).toUpperCase()}
          </span>
        )}
        {session.user?.name && (
          <span className={styles.profileName}>
            {session.user.name}
          </span>
        )}
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* En-tête avec photo et nom */}
          <div className={styles.dropdownHeader}>
            <div className={styles.userInfo}>
              {session.user?.image ? (
                <div className={styles.headerAvatar}>
                  <img src={session.user.image} alt="Avatar" className={styles.headerAvatarImg} />
                </div>
              ) : (
                <div className={styles.headerAvatarPlaceholder}>
                  {(session.user?.name || 'U')?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.userName}>{session.user?.name || 'Utilisateur'}</div>
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Options du menu */}
          <div className={styles.menuItems}>
            <button
              className={styles.menuItem}
              onClick={handleProfileClick}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profil</span>
            </button>

                    <button
                      className={styles.menuItem}
                      onClick={handleSettingsClick}
                    >
                      <SettingsIcon className={styles.menuIcon} width={20} height={20} />
                      <span>Paramètres</span>
                    </button>

            <div className={styles.divider}></div>

            {/* Toggle Light/Dark mode */}
            <div className={styles.menuItem}>
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {theme === 'dark' ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                ) : (
                  <circle cx="12" cy="12" r="5"></circle>
                )}
              </svg>
              <span>Light theme</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={theme === 'light'}
                  onChange={toggleTheme}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.divider}></div>

            <button
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={handleSignOut}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

