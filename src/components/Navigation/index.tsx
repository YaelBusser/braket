'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '../ui'
import { useAuthModal } from '../AuthModal/AuthModalContext'
import UserMenu from '../UserMenu'
import styles from './index.module.scss'

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
              <UserMenu />
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

