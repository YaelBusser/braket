'use client'

import { useEffect, useState, memo, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCreateTournamentModal } from '../CreateTournamentModal/CreateTournamentModalContext'
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
  const { openCreateTournamentModal } = useCreateTournamentModal()
  const [isPending, startTransition] = useTransition()

  // Charger les données de manière non-bloquante après le premier rendu
  useEffect(() => {
    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    const load = async () => {
      try {
        // Utiliser un cache pour éviter les requêtes répétées
        const res = await fetch('/api/profile/tournaments', { 
          cache: 'default',
          next: { revalidate: 30 } // Revalider toutes les 30 secondes
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
    
    // Charger après un court délai pour ne pas bloquer la navigation
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 2000 })
    } else {
      setTimeout(load, 100)
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

      {/* Bouton créer/ajouter - en bas */}
      <button 
        onClick={openCreateTournamentModal}
        className={`${styles.avatarButton} ${styles.createButton}`} 
        title="Créer un tournoi"
        type="button"
      >
        <svg 
          className={styles.plusIcon}
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 5V19M5 12H19" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </aside>
  )
}

export default memo(Sidebar)

