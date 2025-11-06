'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from './page.module.scss'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si l'utilisateur est connecté et que c'est son propre profil, rediriger vers /profile
    if (session?.user && (session.user as any).id === userId) {
      router.push('/profile')
      return
    }

    const loadUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [userId, session, router])

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>Chargement...</div>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.pseudo} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user.pseudo.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.profileInfo}>
              <h1 className={styles.name}>{user.pseudo}</h1>
              {user.isEnterprise && (
                <span className={styles.badge}>Entreprise</span>
              )}
              <p className={styles.memberSince}>
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{user._count.tournaments}</div>
              <div className={styles.statLabel}>Tournois créés</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{user._count.registrations}</div>
              <div className={styles.statLabel}>Inscriptions</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{user._count.teamMembers}</div>
              <div className={styles.statLabel}>Équipes</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

