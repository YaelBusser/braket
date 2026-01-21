'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import styles from './index.module.scss'

interface UserMenuProps {
  forceOpen?: boolean
}

export default function UserMenu({ forceOpen = false }: UserMenuProps = {}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(forceOpen)
  const menuRef = useRef<HTMLDivElement>(null)

  // Si forceOpen change, mettre à jour isOpen
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
    }
  }, [forceOpen])

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

  const handleTeamsClick = () => {
    setIsOpen(false)
    router.push('/teams')
  }

  if (!session?.user) {
    return null
  }

  // Si forceOpen est activé, afficher directement le menu sans le bouton
  if (forceOpen) {
    return (
      <div className={`${styles.userMenuContainer} ${styles.userMenuContainerMobile}`} ref={menuRef}>
        <div className={`${styles.dropdown} ${styles.dropdownMobile}`}>
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
              onClick={handleTeamsClick}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Mes équipes</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={handleSettingsClick}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Paramètres</span>
            </button>

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
      </div>
    )
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
              onClick={handleTeamsClick}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Mes équipes</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={handleSettingsClick}
            >
              <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Paramètres</span>
            </button>

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

