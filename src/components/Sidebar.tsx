'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './Sidebar.module.scss'

type MiniTournament = {
  id: string
  name: string
  posterUrl?: string | null
  game?: string | null
}

export default function Sidebar() {
  const [participating, setParticipating] = useState<MiniTournament[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile/tournaments', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setParticipating(data.participating || [])
      } catch {}
    }
    load()
  }, [])

  return (
    <aside className={styles.sidebar} aria-label="Mes tournois">
      {/* Bouton créer/ajouter */}
      <Link href="/tournaments/create" className={styles.avatarButton} title="Créer un tournoi">
        <span className={styles.plus}>+</span>
      </Link>

      {participating.map(t => (
        <Link key={t.id} href={`/tournaments/${t.id}`} className={styles.avatarButton} title={t.name}>
          {t.posterUrl ? (
            <img src={t.posterUrl} alt={t.name} className={styles.avatarImage} />
          ) : (
            <span className={styles.plus}>🎮</span>
          )}
        </Link>
      ))}
    </aside>
  )
}


