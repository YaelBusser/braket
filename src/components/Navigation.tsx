'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui'
import styles from './Navigation.module.scss'
import { useCategory } from './providers/category-provider'

export default function Navigation() {
  const { data: session, status } = useSession()
  const { category, setCategory } = useCategory()
  const [selectedCategory, setSelectedCategory] = useState('VIDEO_GAMES')
  const pathname = usePathname()

  useEffect(() => {
    setSelectedCategory(category)
  }, [category])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedCategory(value)
    setCategory(value as any)
    if (pathname !== '/') {
      window.location.href = '/'
    } else {
      window.location.reload()
    }
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          LeTournoi
        </Link>
        
        <div className={styles.menu}>
          <select onChange={handleCategoryChange} value={selectedCategory} className={styles.categorySelect}>
            <option value="VIDEO_GAMES">Jeux vidéo</option>
            <option value="SPORTS">Sports</option>
            <option value="BOARD_GAMES">Jeux de société</option>
          </select>
          {status === 'loading' ? (
            <div className={styles.loading}>Chargement...</div>
          ) : session ? (
            <div className={styles.userMenu}>
              <Link href="/tournaments" className={styles.profileLink}>Tournois</Link>
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
