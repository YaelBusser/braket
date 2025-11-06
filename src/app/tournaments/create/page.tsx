'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientPageWrapper from '../../../components/ClientPageWrapper'
import { useNotification } from '../../../components/providers/notification-provider'
import styles from './page.module.scss'
import { filterGames, GameInfo } from '@/data/games'

export default function CreateTournamentPage() {
  return (
    <ClientPageWrapper>
      <CreateForm />
    </ClientPageWrapper>
  )
}

function CreateForm() {
  const router = useRouter()
  const { notify } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    game: '',
    format: 'SINGLE_ELIMINATION',
    visibility: 'PUBLIC',
    isTeamBased: 'solo',
    maxParticipants: '',
    teamMinSize: '',
    teamMaxSize: '',
    startDate: '',
    endDate: ''
  })
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState<GameInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedGameName, setSelectedGameName] = useState<string>('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGameInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGameQuery(value)
    // toute saisie manuelle invalide la sélection
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
    setIsLoading(true)
    try {
      let res: Response
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.description) fd.append('description', form.description)
      fd.append('game', selectedGameName)
      fd.append('format', form.format)
      fd.append('visibility', form.visibility)
      fd.append('isTeamBased', String(form.isTeamBased === 'team'))
      if (form.maxParticipants) fd.append('maxParticipants', form.maxParticipants)
      if (form.isTeamBased === 'team') {
        if (form.teamMinSize) fd.append('teamMinSize', form.teamMinSize)
        if (form.teamMaxSize) fd.append('teamMaxSize', form.teamMaxSize)
      }
      if (form.startDate) fd.append('startDate', form.startDate)
      if (form.endDate) fd.append('endDate', form.endDate)
      if (posterFile) fd.append('poster', posterFile)
      res = await fetch('/api/tournaments', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        if (res.status === 409) {
          notify({ type: 'error', message: '⚠️ Limite atteinte ! Vous ne pouvez pas avoir plus de 10 tournois actifs simultanément. Terminez ou supprimez un tournoi existant pour en créer un nouveau.' })
          return
        }
        throw new Error(data.message || 'Erreur à la création')
      }
      const data = await res.json()
      notify({ type: 'success', message: '🎉 Tournoi créé avec succès ! Redirection vers votre tournoi...' })
      setTimeout(() => {
        router.push(`/tournaments/${data.tournament.id}`)
      }, 1500)
    } catch (err) {
      notify({ type: 'error', message: `❌ ${(err as Error).message}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPosterFile(file)
    if (posterPreview) URL.revokeObjectURL(posterPreview)
    if (file) setPosterPreview(URL.createObjectURL(file))
    else setPosterPreview(null)
  }

  return (
    <div className={styles.createTournamentPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Créer un tournoi</h1>
          <p className={styles.subtitle}>Organisez votre propre tournoi et invitez des joueurs</p>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Première ligne - Nom et Catégorie */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={`${styles.label} ${styles.required}`} htmlFor="name">Nom</label>
                <input className={styles.input} id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
            </div>

            {/* Description - Pleine largeur */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">Description</label>
              <textarea className={styles.textarea} id="description" name="description" value={form.description} onChange={handleChange} />
            </div>

            {/* Jeu - Pleine largeur */}
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="game">Jeu</label>
              <div className={styles.gameInputContainer}>
                <input
                  className={styles.input}
                  id="game"
                  name="game"
                  value={gameQuery}
                  onChange={handleGameInput}
                  placeholder="Rechercher un jeu..."
                  required
                />
                {gameQuery.length >= 2 && (
                  <div className={styles.gameResults}>
                    {/* Debug info */}
                    <div style={{padding: '10px', background: '#333', color: '#fff', fontSize: '12px'}}>
                      Debug: isSearching={isSearching.toString()}, gameResults.length={gameResults.length}, gameQuery="{gameQuery}"
                    </div>
                    {isSearching ? (
                      <div className={styles.loadingItem}>
                        <div className={styles.spinner}></div>
                        <span>Recherche...</span>
                      </div>
                    ) : gameResults.length > 0 ? (
                      gameResults.map(g => (
                        <div key={g.id} className={styles.gameItem} onClick={() => handlePickGame(g.name, g.id)}>
                          {g.image ? (
                            <img src={g.image} alt="" className={styles.gameImage} />
                          ) : (
                            <div className={styles.gameImagePlaceholder}>
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={styles.gameInfo}>
                            <span className={styles.gameName}>{g.name}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResults}>
                        <span>Aucun jeu trouvé pour "{gameQuery}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {gameQuery && !selectedGameId && (
                <div className={styles.helpText}>
                  Veuillez sélectionner un jeu dans la liste.
                </div>
              )}
            </div>

            {/* Deuxième ligne - Mode et Participants */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mode</label>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" name="isTeamBased" value="solo" checked={form.isTeamBased === 'solo'} onChange={(e) => setForm(p => ({ ...p, isTeamBased: e.target.value }))} />
                    Solo
                  </label>
                  <label>
                    <input type="radio" name="isTeamBased" value="team" checked={form.isTeamBased === 'team'} onChange={(e) => setForm(p => ({ ...p, isTeamBased: e.target.value }))} />
                    Équipe
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="maxParticipants">Nombre de participants</label>
                <input id="maxParticipants" name="maxParticipants" className={styles.input} type="number" min="2" placeholder="ex: 16" value={form.maxParticipants} onChange={(e) => setForm(p => ({ ...p, maxParticipants: e.target.value }))} />
              </div>
            </div>

            {/* Taille des équipes - Seulement si mode équipe */}
            {form.isTeamBased === 'team' && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="teamMinSize">Taille min. par équipe</label>
                  <input id="teamMinSize" className={styles.input} type="number" min="1" value={form.teamMinSize} onChange={(e) => setForm(p => ({ ...p, teamMinSize: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="teamMaxSize">Taille max. par équipe</label>
                  <input id="teamMaxSize" className={styles.input} type="number" min="1" value={form.teamMaxSize} onChange={(e) => setForm(p => ({ ...p, teamMaxSize: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Troisième ligne - Format */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="format">Format</label>
                <select className={styles.select} id="format" name="format" value={form.format} onChange={handleChange}>
                  <option value="SINGLE_ELIMINATION">Elimination directe</option>
                  <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                  <option value="ROUND_ROBIN" disabled>Round robin (bientôt)</option>
                </select>
              </div>
            </div>

            {/* Quatrième ligne - Visibilité et Affiche */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="visibility">Visibilité</label>
                <select className={styles.select} id="visibility" name="visibility" value={form.visibility} onChange={handleChange}>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="poster">Affiche du tournoi</label>
                <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePosterChange} className={styles.input} />
              </div>
            </div>

            {/* Aperçu de l'affiche - Pleine largeur */}
            {posterPreview && (
              <div className={styles.formGroup}>
                <div className={styles.posterPreview}>
                  <img src={posterPreview} alt="Aperçu affiche" />
                </div>
              </div>
            )}

            {/* Cinquième ligne - Dates */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="startDate">Date de début</label>
                <input className={styles.input} id="startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="endDate">Date de fin</label>
                <input className={styles.input} id="endDate" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => router.push('/')}>Annuler</button>
              <button type="submit" className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`} disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


