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
  game?: string | null
}

function Sidebar() {
  const [participating, setParticipating] = useState<MiniTournament[]>([])
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

  return (
    <aside className={styles.sidebar} aria-label="Tournois créés">
      {/* Bouton créer/ajouter */}
      <button 
        onClick={openCreateTournamentModal}
        className={styles.avatarButton} 
        title="Créer un tournoi"
        type="button"
      >
        <span className={styles.plus}>+</span>
      </button>

      {participating.map(t => (
        <Link 
          key={t.id} 
          href={`/tournaments/${t.id}`} 
          className={styles.avatarButton} 
          title={t.name}
          prefetch={true}
        >
          {t.posterUrl ? (
            <Image 
              src={t.posterUrl} 
              alt={t.name} 
              width={40}
              height={40}
              className={styles.avatarImage}
              loading="lazy"
            />
          ) : (
            <span className={styles.plus}>🎮</span>
          )}
        </Link>
      ))}
    </aside>
  )
}

export default memo(Sidebar)

