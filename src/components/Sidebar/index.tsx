'use client'

import { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './index.module.scss'

type MiniTournament = {
  id: string
  name: string
  posterUrl?: string | null
  game?: string | null
}

function Sidebar() {
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

