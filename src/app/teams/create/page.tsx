'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../../../components/providers/notification-provider'
import { useAuthModal } from '../../../components/AuthModalContext'
import styles from './page.module.scss'
import { GAMES, filterGames, GameInfo } from '@/data/games'

export default function CreateTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    game: '',
    description: ''
  })
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState<GameInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedGameName, setSelectedGameName] = useState<string>('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', '/teams/create') } catch {}
      openAuthModal('login')
      router.push('/')
    }
  }, [status, router, openAuthModal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGameInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGameQuery(value)
    setSelectedGameId(null)
    setSelectedGameName('')
    
    if (value.trim().length < 2) {
      setGameResults([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    try {
      const results = filterGames(value)
      setGameResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const handlePickGame = (name: string, id: string) => {
    setForm(prev => ({ ...prev, game: name }))
    setGameQuery(name)
    setSelectedGameId(id)
    setSelectedGameName(name)
    setGameResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGameId || selectedGameName !== gameQuery) {
      notify({ type: 'error', message: '❌ Veuillez choisir un jeu parmi les résultats de recherche' })
      return
    }

    if (!form.name.trim()) {
      notify({ type: 'error', message: '❌ Le nom de l\'équipe est requis' })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          game: selectedGameName,
          description: form.description,
          gameId: selectedGameId
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Erreur lors de la création de l\'équipe')
      }

      const data = await res.json()
      notify({ type: 'success', message: '🎉 Équipe créée avec succès ! Redirection...' })
      
      setTimeout(() => {
        router.push(`/teams/${data.team.id}`)
      }, 1500)
    } catch (err) {
      notify({ type: 'error', message: `❌ ${(err as Error).message}` })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className={styles.createTeamPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Créer une équipe</h1>
          <p className={styles.subtitle}>Formez votre équipe pour participer aux tournois</p>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">
                Nom de l'équipe <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="Entrez le nom de votre équipe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="game">
                Jeu <span className={styles.required}>*</span>
              </label>
              <div className={styles.gameInputContainer}>
                <input
                  id="game"
                  name="game"
                  type="text"
                  value={gameQuery}
                  onChange={handleGameInput}
                  className={styles.input}
                  placeholder="Rechercher un jeu..."
                  required
                />
                {(isSearching || gameResults.length > 0) && (
                  <div className={styles.gameResults}>
                    {isSearching && (
                      <div className={styles.loadingItem}>
                        <div className={styles.spinner}></div>
                        <span>Recherche...</span>
                      </div>
                    )}
                    {gameResults.map(game => (
                      <div
                        key={game.id}
                        className={styles.gameItem}
                        onClick={() => handlePickGame(game.name, game.id)}
                      >
                        {game.image && (
                          <img
                            src={game.image}
                            alt={game.name}
                            className={styles.gameImage}
                          />
                        )}
                        <span className={styles.gameName}>{game.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {gameQuery && !selectedGameId && (
                <p className={styles.helpText}>
                  Veuillez sélectionner un jeu dans la liste.
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">
                Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Décrivez votre équipe, ses objectifs, etc."
                rows={4}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => router.push('/teams')}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading || !selectedGameId || !form.name.trim()}
              >
                {isLoading ? 'Création...' : 'Créer l\'équipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
