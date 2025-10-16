'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui'
import styles from './Navigation.module.scss'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()


  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            Bracket
          </Link>
          
          <div className={styles.navLinks}>
            <Link href="/games" className={styles.navLink}>Jeux</Link>
            <Link href="/tournaments" className={styles.navLink}>Tournois</Link>
          </div>
        </div>
        
        <div className={styles.menu}>
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
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Inscription
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
