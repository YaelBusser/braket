'use client'

import { useSession } from 'next-auth/react'
import { memo, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '../ui'
import { useAuthModal } from '../AuthModal/AuthModalContext'
import { useCreateTournamentModal } from '../CreateTournamentModal/CreateTournamentModalContext'
import UserMenu from '../UserMenu'
import NotificationBell from '../NotificationBell'
import styles from './index.module.scss'

function Navigation() {
  const { data: session, status } = useSession()
  const { openAuthModal } = useAuthModal()
  const { openCreateTournamentModal } = useCreateTournamentModal()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAdmin = (session?.user as any)?.isAdmin === 1

  // Éviter les problèmes d'hydratation en s'assurant que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fermer le menu mobile quand on clique sur un lien
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  // Fermer le menu mobile quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMobileMenuOpen && !target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.hamburgerButton}`)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      // Empêcher le scroll du body quand le menu est ouvert
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

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

  const renderMobileAuthSection = useMemo(() => {
    // Pendant l'hydratation, ne rien afficher pour éviter les différences serveur/client
    if (!mounted) {
      return null
    }
    if (status === 'loading') {
      return null
    }
    if (session) {
      return (
        <div className={styles.mobileUserSection}>
          <div className={styles.mobileUserHeader}>
            <div className={styles.mobileUserInfo}>
              {session.user?.image ? (
                <span className={styles.mobileUserAvatar}>
                  <img src={session.user.image} alt="Avatar" />
                </span>
              ) : (
                <span className={styles.mobileUserAvatarPlaceholder}>
                  {(session.user?.name || 'P')?.charAt(0).toUpperCase()}
                </span>
              )}
              {session.user?.name && (
                <span className={styles.mobileUserName}>
                  {session.user.name}
                </span>
              )}
            </div>
            {mounted && session && <NotificationBell />}
          </div>
          <UserMenu forceOpen={true} />
        </div>
      )
    }
    return authButtons
  }, [mounted, status, session, authButtons])

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo} onClick={handleLinkClick}>
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
            <Link href="/tournaments" className={styles.navLink} prefetch={true} onClick={handleLinkClick}>Tournois</Link>
            {mounted && session && (
              <Link href="/teams" className={styles.navLink} prefetch={true} onClick={handleLinkClick}>Équipes</Link>
            )}
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
          {mounted && session && isAdmin && (
            <button 
              onClick={openCreateTournamentModal}
              className={styles.navLink}
              type="button"
            >
              Créer un tournoi
            </button>
          )}
          {mounted && session && <NotificationBell />}
          {renderAuthSection}
        </div>
        <button
          className={styles.hamburgerButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}></span>
        </button>
      </div>
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileSearchWrapper}>
            <SearchBar
              placeholder="Rechercher..."
              size="xs"
              variant="header"
              hideButton
              autoSearchDelay={500}
              redirectHomeOnEmpty
            />
          </div>
          <div className={styles.mobileNavLinks}>
            <Link href="/tournaments" className={styles.mobileNavLink} prefetch={true} onClick={handleLinkClick}>
              Tournois
            </Link>
            {mounted && session && (
              <Link href="/teams" className={styles.mobileNavLink} prefetch={true} onClick={handleLinkClick}>
                Équipes
              </Link>
            )}
            {mounted && session && isAdmin && (
              <button 
                onClick={() => {
                  openCreateTournamentModal()
                  handleLinkClick()
                }}
                className={styles.mobileNavLink}
                type="button"
              >
                Créer un tournoi
              </button>
            )}
          </div>
          <div className={styles.mobileAuthSection}>
            {renderMobileAuthSection}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default memo(Navigation)

