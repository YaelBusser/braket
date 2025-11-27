'use client'

import { useSession } from 'next-auth/react'
import { memo, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '../ui'
import { useAuthModal } from '../AuthModal/AuthModalContext'
import UserMenu from '../UserMenu'
import styles from './index.module.scss'

function Navigation() {
  const { data: session, status } = useSession()
  const { openAuthModal } = useAuthModal()
  const [mounted, setMounted] = useState(false)

  // Éviter les problèmes d'hydratation en s'assurant que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

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
    // Pendant l'hydratation, ne rien afficher pour éviter les différences serveur/client
    if (!mounted) {
      return <div className={styles.userMenuPlaceholder} />
    }
    if (status === 'loading') {
      // Afficher un espace réservé pendant le chargement pour éviter le flash des boutons
      return <div className={styles.userMenuPlaceholder} />
    }
    if (session) {
      return (
        <div className={styles.userMenu}>
          <UserMenu />
        </div>
      )
    }
    return authButtons
  }, [mounted, status, session, authButtons])

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
            <Link href="/tournaments" className={styles.navLink} prefetch={true}>Rejoindre un tournoi</Link>
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

