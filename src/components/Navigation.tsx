'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from './ui'
import styles from './Navigation.module.scss'

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          LeTournoi
        </Link>
        
        <div className={styles.menu}>
          {status === 'loading' ? (
            <div className={styles.loading}>Chargement...</div>
          ) : session ? (
            <div className={styles.userMenu}>
              <Link href="/profile" className={styles.profileLink}>
                {session.user?.name || 'Profil'}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Déconnexion
              </Button>
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
