'use client'

import { useEffect, useState, memo, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './index.module.scss'

type MiniTournament = {
  id: string
  name: string
  posterUrl?: string | null
  logoUrl?: string | null
  game?: string | null
  gameRef?: {
    imageUrl?: string | null
    logoUrl?: string | null
    posterUrl?: string | null
  } | null
}

function Sidebar() {
  const [participating, setParticipating] = useState<MiniTournament[]>([])
  const [created, setCreated] = useState<MiniTournament[]>([])
  const [isPending, startTransition] = useTransition()
  const { data: session } = useSession()

  // Fonction pour charger les données
  const loadTournaments = async () => {
    try {
      // Ne pas utiliser le cache pour avoir les données à jour
      const res = await fetch('/api/profile/tournaments', { 
        cache: 'no-store'
      })
      if (!res.ok) return
      const data = await res.json()
      // Utiliser startTransition pour ne pas bloquer le rendu
      startTransition(() => {
        setParticipating(data.participating || [])
        setCreated(data.created || [])
      })
    } catch {}
  }

  // Charger les données de manière non-bloquante après le premier rendu
  useEffect(() => {
    // Charger après un court délai pour ne pas bloquer la navigation
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => loadTournaments(), { timeout: 2000 })
    } else {
      setTimeout(loadTournaments, 100)
    }

    // Écouter les événements de rafraîchissement
    const handleRefresh = () => {
      loadTournaments()
    }

    window.addEventListener('tournament-registration-changed', handleRefresh)
    window.addEventListener('tournament-unregistration-changed', handleRefresh)

    return () => {
      window.removeEventListener('tournament-registration-changed', handleRefresh)
      window.removeEventListener('tournament-unregistration-changed', handleRefresh)
    }
  }, [])

  const renderTournamentLogo = (t: MiniTournament, isParticipating: boolean = false) => {
    const imageUrl = t.logoUrl || t.gameRef?.logoUrl
    return (
      <Link 
        key={t.id} 
        href={`/tournaments/${t.id}`} 
        className={`${styles.avatarButton} ${isParticipating ? styles.participating : ''}`} 
        title={t.name}
        prefetch={true}
      >
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={t.name} 
            width={88}
            height={88}
            className={styles.avatarImage}
            loading="lazy"
            quality={90}
          />
        ) : (
          <span className={styles.plus}>🎮</span>
        )}
      </Link>
    )
  }

  return (
    <aside className={styles.sidebar} aria-label="Tournois">
      {/* Tournois auxquels je participe */}
      {participating.length > 0 && (
        <div className={`${styles.section} ${styles.sectionTop}`}>
          {participating.map(t => renderTournamentLogo(t, true))}
        </div>
      )}

      {/* Barre de séparation - fixe entre les sections */}
      {(participating.length > 0 && created.length > 0) && (
        <div className={styles.separator} />
      )}

      {/* Tournois que j'ai créés */}
      {created.length > 0 && (
        <div className={`${styles.section} ${styles.sectionBottom}`}>
          {created.map(t => renderTournamentLogo(t, false))}
        </div>
      )}
    </aside>
  )
}

export default memo(Sidebar)

