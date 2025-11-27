'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import { useCreateTournamentModal } from '../../components/CreateTournamentModal/CreateTournamentModalContext'
import { TournamentCard, PageContent } from '../../components/ui'
import styles from './page.module.scss'

export default function MyTournamentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const { openCreateTournamentModal } = useCreateTournamentModal()
  
  // États pour les données utilisateur
  const [userTournaments, setUserTournaments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', '/my-tournaments') } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
  }, [status, router, openAuthModal])

  // Charger les données utilisateur
  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    setLoadingData(true)
    try {
      // Charger les tournois de l'utilisateur
      const tournamentsRes = await fetch('/api/tournaments?mine=true')
      if (tournamentsRes.ok) {
        const data = await tournamentsRes.json()
        setUserTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      notify({ message: 'Erreur lors du chargement de vos tournois', type: 'error' })
    } finally {
      setLoadingData(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <PageContent>
        <div className={styles.myTournamentsPage}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mes tournois</h1>
            <button 
              className={styles.createBtn}
              onClick={openCreateTournamentModal}
            >
              Créer un tournoi
            </button>
          </div>
          
          <div className={styles.tournamentList}>
            {loadingData ? (
              <div className={styles.loading}>Chargement...</div>
            ) : !userTournaments || !Array.isArray(userTournaments) || userTournaments.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Aucun tournoi créé</p>
                <button 
                  className={styles.createBtn}
                  onClick={openCreateTournamentModal}
                >
                  Créer mon premier tournoi
                </button>
              </div>
            ) : (
              <div className={styles.tournamentGrid}>
                {userTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    userId={(session?.user as any)?.id || null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContent>
  )
}

