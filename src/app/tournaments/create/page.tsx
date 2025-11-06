'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ClientPageWrapper from '../../../components/ClientPageWrapper'
import { useNotification } from '../../../components/providers/notification-provider'
import styles from './page.module.scss'
import { GameInfo } from '@/data/games'

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
  const formContainerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0) // 0: game, 1: format, 2: identity, 3: dates, 4: summary
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
  const [allGames, setAllGames] = useState<GameInfo[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedGameName, setSelectedGameName] = useState<string>('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showAllGames, setShowAllGames] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Charger les jeux depuis la DB
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/games')
        const data = await res.json()
        const list: GameInfo[] = (data.games || []).map((g: any) => ({
          id: g.id, name: g.name, slug: g.slug, image: g.imageUrl
        }))
        setAllGames(list)
      } catch {}
    })()
  }, [])

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
      const q = value.trim().toLowerCase()
      const results = allGames.filter(g => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q))
      setGameResults(results.slice(0, 20))
    } finally {
      setIsSearching(false)
    }
  }

  const handlePickGame = (name: string, id: string) => {
    // Si le jeu est déjà sélectionné, le désélectionner
    if (selectedGameId === id) {
      setForm(prev => ({ ...prev, game: '' }))
      setSelectedGameId(null)
      setSelectedGameName('')
      return
    }
    
    // Sinon, sélectionner le jeu
    setForm(prev => ({ ...prev, game: name }))
    setGameQuery('') // Réinitialiser la recherche
    setSelectedGameId(id)
    setSelectedGameName(name)
    setGameResults([])
    // Ne pas réinitialiser showAllGames pour garder l'état d'affichage
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGameId || !selectedGameName) {
      notify({ type: 'error', message: '❌ Veuillez choisir un jeu' })
      return
    }
    setIsLoading(true)
    try {
      let res: Response
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.description) fd.append('description', form.description)
      fd.append('game', selectedGameName)
      fd.append('gameId', selectedGameId)
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
      if (logoFile) fd.append('logo', logoFile)
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogoFile(file)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    if (file) setLogoPreview(URL.createObjectURL(file))
    else setLogoPreview(null)
  }

  const handleStepChange = (newStep: number) => {
    setStep(newStep)
    // Scroll vers le haut du container du formulaire avec offset
    setTimeout(() => {
      if (formContainerRef.current) {
        const elementPosition = formContainerRef.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 100 // 100px d'offset vers le haut
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <div className={styles.createTournamentPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Créer un tournoi</h1>
          <p className={styles.subtitle}>Organisez votre propre tournoi et invitez des joueurs</p>
        </div>

        <div className={styles.formContainer} ref={formContainerRef}>
          {/* Indicateur d'étape détaillé */}
          <div className={styles.stepIndicator}>
            <div className={styles.stepSteps}>
              {[
                { num: 1, label: 'Jeu', step: 0 },
                { num: 2, label: 'Format', step: 1 },
                { num: 3, label: 'Identité', step: 2 },
                { num: 4, label: 'Dates', step: 3 },
                { num: 5, label: 'Récap', step: 4 }
              ].map((s, idx, arr) => (
                <div key={s.step} className={styles.stepStepItem}>
                  <div 
                    className={`${styles.stepStepCircle} ${step > s.step ? styles.stepStepCircleActive : ''} ${step === s.step ? styles.stepStepCircleCurrent : ''}`}
                    onClick={() => step > s.step && handleStepChange(s.step)}
                    style={{ cursor: step > s.step ? 'pointer' : 'default' }}
                  >
                    {step > s.step ? '✓' : s.num}
                  </div>
                  <span className={styles.stepStepLabel}>{s.label}</span>
                  {idx < arr.length - 1 && (
                    <div 
                      className={`${styles.stepStepLine} ${step > s.step ? styles.stepStepLineActive : ''}`}
                      style={step > s.step ? { 
                        background: 'linear-gradient(90deg, #ff008c 0%, #6748ff 100%)',
                        backgroundImage: 'none'
                      } : {}}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Étape 0: Choix du jeu */}
          {step === 0 && (
            <div className={styles.form}>
              <h2 className={styles.stepTitle}>Sélection du jeu</h2>
              <div className={styles.formGroup}>
                <label className={`${styles.label} ${styles.required}`}>Choisir un jeu</label>
                <div className={styles.searchGameContainer}>
                  <input 
                    className={styles.searchGameInput} 
                    value={gameQuery} 
                    onChange={handleGameInput} 
                    placeholder="Rechercher un jeu..." 
                  />
                </div>
                <div className={styles.gamesGrid}>
                  {(gameQuery.length >= 2 
                    ? gameResults 
                    : (showAllGames ? allGames : allGames.slice(0, 5))
                  ).map(g => (
                    <div 
                      key={g.id} 
                      className={`${styles.gameCard} ${selectedGameId === g.id ? styles.gameCardSelected : ''}`}
                      onClick={() => handlePickGame(g.name, g.id)}
                    >
                      <div className={styles.gameCardImageContainer}>
                        {g.image ? (
                          <img src={g.image} alt={g.name} className={styles.gameCardImage} />
                        ) : (
                          <div className={styles.gameCardImagePlaceholder}>
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.gameCardText}>
                        <h3 className={styles.gameCardTitle}>{g.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
                {gameQuery.length >= 2 && gameResults.length === 0 && !isSearching && !selectedGameId && (
                  <div className={styles.noResults}>Aucun jeu trouvé pour "{gameQuery}"</div>
                )}
                {!gameQuery && !showAllGames && !selectedGameId && allGames.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button 
                      type="button"
                      className={styles.seeMoreBtn}
                      onClick={() => setShowAllGames(true)}
                    >
                      Voir plus
                    </button>
                  </div>
                )}
                {!selectedGameId && (
                  <div className={styles.helpText}>Sélectionnez un jeu pour continuer</div>
                )}
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.submitBtn} onClick={() => selectedGameId ? handleStepChange(1) : undefined} disabled={!selectedGameId}>Suivant</button>
              </div>
            </div>
          )}

          {/* Étape 1: Format et participants */}
          {step === 1 && (
            <div className={styles.form}>
              <h2 className={styles.stepTitle}>Format et participants</h2>
              
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

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="format">Format du tournoi</label>
                <select className={styles.select} id="format" name="format" value={form.format} onChange={handleChange}>
                  <option value="SINGLE_ELIMINATION">Elimination directe</option>
                  <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                  <option value="ROUND_ROBIN" disabled>Round robin (bientôt)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="visibility">Visibilité</label>
                <select className={styles.select} id="visibility" name="visibility" value={form.visibility} onChange={handleChange}>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => handleStepChange(0)}>Retour</button>
                <button type="button" className={styles.submitBtn} onClick={() => handleStepChange(2)}>Suivant</button>
              </div>
            </div>
          )}

          {/* Étape 2: Identité */}
          {step === 2 && (
            <div className={styles.form}>
              <h2 className={styles.stepTitle}>Identité</h2>
              
              <div className={styles.formGroup}>
                <label className={`${styles.label} ${styles.required}`} htmlFor="name">Nom du tournoi</label>
                <input className={styles.input} id="name" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Tournoi d'été 2024" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="description">Description</label>
                <textarea className={styles.textarea} id="description" name="description" value={form.description} onChange={handleChange} placeholder="Décrivez votre tournoi..." rows={4} />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="logo">Logo du tournoi</label>
                  <input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoChange} className={styles.input} />
                  {logoPreview && (
                    <div className={styles.logoPreview}>
                      <img src={logoPreview} alt="Aperçu logo" />
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="poster">Affiche du tournoi</label>
                  <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePosterChange} className={styles.input} />
                  {posterPreview && (
                    <div className={styles.posterPreview}>
                      <img src={posterPreview} alt="Aperçu affiche" />
                    </div>
                  )}
                </div>
              </div>

              {/* Prévisualisation de la card */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Aperçu</label>
                <div className={styles.cardPreview}>
                  <div className={styles.cardPreviewImage}>
                    {(posterPreview || allGames.find(g => g.id === selectedGameId)?.image) ? (
                      <img 
                        src={posterPreview || allGames.find(g => g.id === selectedGameId)?.image || ''} 
                        alt="Preview" 
                        className={styles.cardPreviewPoster}
                      />
                    ) : (
                      <div className={styles.cardPreviewPlaceholder}>
                        <div className={styles.cardPreviewGameIcon}>🎮</div>
                      </div>
                    )}
                    {allGames.find(g => g.id === selectedGameId)?.image && !posterPreview && (
                      <div className={styles.cardPreviewGameLogo}>
                        <img src={allGames.find(g => g.id === selectedGameId)?.image || ''} alt={selectedGameName} />
                      </div>
                    )}
                  </div>
                  <div className={styles.cardPreviewContent}>
                    {form.startDate && (
                      <div className={styles.cardPreviewDate}>
                        {new Date(form.startDate).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', '').toUpperCase()}
                      </div>
                    )}
                    <div className={styles.cardPreviewInfo}>
                      {logoPreview && (
                        <div className={styles.cardPreviewTournamentLogo}>
                          <img src={logoPreview} alt="Tournament logo" />
                        </div>
                      )}
                      <div className={styles.cardPreviewText}>
                        <h3 className={styles.cardPreviewTitle}>{form.name || 'Nom du tournoi'}</h3>
                        <div className={styles.cardPreviewDetails}>
                          {form.isTeamBased === 'team' && form.teamMinSize && form.teamMaxSize && (
                            <span>{form.teamMinSize}v{form.teamMaxSize}</span>
                          )}
                          {form.isTeamBased === 'team' && form.teamMinSize && form.teamMaxSize && form.format && ' • '}
                          {form.format === 'SINGLE_ELIMINATION' && 'Elimination directe'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => handleStepChange(1)}>Retour</button>
                <button type="button" className={styles.submitBtn} onClick={() => form.name ? handleStepChange(3) : undefined} disabled={!form.name}>Suivant</button>
              </div>
            </div>
          )}

          {/* Étape 3: Dates */}
          {step === 3 && (
            <div className={styles.form}>
              <h2 className={styles.stepTitle}>Dates</h2>
              
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
                <button type="button" className={styles.cancelBtn} onClick={() => handleStepChange(2)}>Retour</button>
                <button type="button" className={styles.submitBtn} onClick={() => handleStepChange(4)}>Suivant</button>
              </div>
            </div>
          )}

          {/* Étape 4: Récapitulatif */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.stepTitle}>Récapitulatif</h2>
              
              <div className={styles.summarySection}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Nom du tournoi</span>
                  <span className={styles.summaryValue}>{form.name || 'Non renseigné'}</span>
                </div>
                
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Jeu</span>
                  <span className={styles.summaryValue}>{selectedGameName || 'Non sélectionné'}</span>
                </div>
                
                {form.description && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Description</span>
                    <span className={styles.summaryValue}>{form.description}</span>
                  </div>
                )}
                
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Mode</span>
                  <span className={styles.summaryValue}>{form.isTeamBased === 'team' ? 'Équipe' : 'Solo'}</span>
                </div>
                
                {form.maxParticipants && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Nombre de participants</span>
                    <span className={styles.summaryValue}>{form.maxParticipants}</span>
                  </div>
                )}
                
                {form.isTeamBased === 'team' && (form.teamMinSize || form.teamMaxSize) && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Taille des équipes</span>
                    <span className={styles.summaryValue}>
                      {form.teamMinSize && form.teamMaxSize 
                        ? `${form.teamMinSize} - ${form.teamMaxSize} joueurs`
                        : form.teamMinSize 
                        ? `Min: ${form.teamMinSize} joueurs`
                        : `Max: ${form.teamMaxSize} joueurs`}
                    </span>
                  </div>
                )}
                
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Format</span>
                  <span className={styles.summaryValue}>
                    {form.format === 'SINGLE_ELIMINATION' ? 'Elimination directe' : form.format}
                  </span>
                </div>
                
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Visibilité</span>
                  <span className={styles.summaryValue}>{form.visibility === 'PUBLIC' ? 'Public' : 'Privé'}</span>
                </div>
                
                {form.startDate && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Date de début</span>
                    <span className={styles.summaryValue}>{new Date(form.startDate).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                
                {form.endDate && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Date de fin</span>
                    <span className={styles.summaryValue}>{new Date(form.endDate).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                
                {(logoPreview || posterPreview) && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Visuels</span>
                    <div className={styles.summaryVisuals}>
                      {logoPreview && (
                        <div className={styles.summaryVisualItem}>
                          <span>Logo</span>
                          <img src={logoPreview} alt="Logo" />
                        </div>
                      )}
                      {posterPreview && (
                        <div className={styles.summaryVisualItem}>
                          <span>Affiche</span>
                          <img src={posterPreview} alt="Affiche" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => handleStepChange(3)}>Retour</button>
                <button type="submit" className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`} disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer le tournoi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}


