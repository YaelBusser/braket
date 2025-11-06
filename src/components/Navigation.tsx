'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from './ui'
import { useAuthModal } from './AuthModalContext'
import styles from './Navigation.module.scss'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { openAuthModal } = useAuthModal()

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            <img 
              src="/icons/icon_text_dark.svg" 
              alt="Braket" 
              style={{ height: '28px', width: 'auto' }}
            />
          </Link>
          
          <div className={styles.navLinks}>
            <Link href="/tournaments" className={styles.navLink}>Tournois</Link>
          </div>
        </div>
        <div className={styles.menu}>
          <div className={styles.searchWrapper}>
            <SearchBar
              placeholder="Rechercher..."
              size="xs"
              variant="header"
              hideButton
              autoSearchDelay={500}
              redirectHomeOnEmpty
            />
          </div>
          {status === 'loading' ? (
            <div className={styles.loading}>Chargement...</div>
          ) : session ? (
            <div className={styles.userMenu}>
              <Link href="/profile" className={styles.profileLink}>
                {session.user?.image ? (
                  <span className={styles.profileAvatar}>
                    <img src={session.user.image} alt="Avatar" className={styles.profileAvatarImg} />
                  </span>
                ) : (
                  <span className={styles.profileAvatarPlaceholder}>
                    {(session.user?.name || 'P')?.charAt(0).toUpperCase()}
                  </span>
                )}
                {
                  session.user?.name && (
                    <span className={styles.profileName}>
                      {session.user.name}
                    </span>
                  )
                }
              </Link>
            </div>
          ) : (
            <div className={styles.authMenu}>
              <button 
                className={styles.authButtonLogin}
                onClick={() => openAuthModal('login')}
              >
                Se connecter
              </button>
              <button 
                className={styles.authButtonRegister}
                onClick={() => openAuthModal('register')}
              >
                S'inscrire
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
