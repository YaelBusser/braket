'use client'

import { useSession } from 'next-auth/react'
import { memo, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '../ui'
import { useAuthModal } from '../AuthModal/AuthModalContext'
import UserMenu from '../UserMenu'
import styles from './index.module.scss'

function Navigation() {
  const { data: session, status } = useSession()
  const { openAuthModal } = useAuthModal()

  const authButtons = useMemo(() => (
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
  ), [openAuthModal])

  const renderAuthSection = useMemo(() => {
    if (status === 'loading') {
      return authButtons
    }
    if (session) {
      return (
        <div className={styles.userMenu}>
          <UserMenu />
        </div>
      )
    }
    return authButtons
  }, [status, session, authButtons])

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            <Image 
              src="/icons/icon_text_dark.svg" 
              alt="Braket" 
              width={120}
              height={28}
              priority
              style={{ height: '28px', width: 'auto' }}
            />
          </Link>
          
          <div className={styles.navLinks}>
            {session && (
              <Link href="/my-tournaments" className={styles.navLink}>Mes tournois</Link>
            )}
            <Link href="/tournaments" className={styles.navLink}>Tournois</Link>
            <Link href="/games" className={styles.navLink}>Jeux</Link>
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
          {renderAuthSection}
        </div>
      </div>
    </nav>
  )
}

export default memo(Navigation)

