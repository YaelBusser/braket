'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '../providers/notification-provider'
import { useAuthModal } from '../AuthModal/AuthModalContext'
import { getGamePosterPath, getGameLogoPath } from '@/utils/gameLogoUtils'
import { GameInfo } from '@/data/games'
import TournamentCard from '../ui/TournamentCard'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/image'
import styles from './index.module.scss'

const STORAGE_KEY = 'lt_tournament_draft'

interface TournamentDraft {
  step: number
  form: {
    name: string
    description: string
    game: string
    format: string
    visibility: string
    isTeamBased: string
    teamMinSize: string
    teamMaxSize: string
    startDate: string
  }
  selectedGameId: string | null
  selectedGameName: string
}

interface CreateTournamentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTournamentModal({ isOpen, onClose }: CreateTournamentModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const [step, setStep] = useState(0) // 0: Jeu, 1: General, 2: Format, 3: Date, 4: Visuel, 5: Récapitulatif
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    game: '',
    format: 'SINGLE_ELIMINATION',
    visibility: 'PUBLIC',
    isTeamBased: 'solo',
    teamMinSize: '',
    teamMaxSize: '',
    startDate: ''
  })
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState<GameInfo[]>([])
  const [allGames, setAllGames] = useState<GameInfo[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedGameName, setSelectedGameName] = useState<string>('')
  const [userPseudo, setUserPseudo] = useState<string>('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo')
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // Charger les données utilisateur
  useEffect(() => {
    if (isOpen && session) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.pseudo) {
            setUserPseudo(data.user.pseudo)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, session])

  // Charger les jeux depuis la DB
  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await fetch('/api/games')
          const data = await res.json()
          const list: GameInfo[] = (data.games || []).map((g: any) => ({
            id: g.id, name: g.name, slug: g.slug, image: getGamePosterPath(g.name) || g.imageUrl
          }))
          setAllGames(list)
        } catch {}
      })()
    }
  }, [isOpen])

  // Restaurer depuis localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const draft: TournamentDraft = JSON.parse(saved)
          setForm(draft.form)
          setSelectedGameId(draft.selectedGameId)
          setSelectedGameName(draft.selectedGameName)
          setStep(draft.step || 0)
        }
      } catch {}
    }
  }, [isOpen])

  // Sauvegarder dans localStorage
  const saveToLocalStorage = () => {
    try {
      const draft: TournamentDraft = {
        step,
        form,
        selectedGameId,
        selectedGameName
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {}
  }

  useEffect(() => {
    if (isOpen) {
      saveToLocalStorage()
    }
  }, [step, form, selectedGameId, selectedGameName, isOpen])

  // Gérer le scroll du body
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      return
    }
    
    try {
      const q = value.trim().toLowerCase()
      const results = allGames.filter(g => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q))
      setGameResults(results.slice(0, 20))
    } catch {}
  }

  const handlePickGame = (name: string, id: string) => {
    if (selectedGameId === id) {
      setForm(prev => ({ ...prev, game: '' }))
      setSelectedGameId(null)
      setSelectedGameName('')
      return
    }
    
    setForm(prev => ({ ...prev, game: name }))
    setGameQuery('')
    setSelectedGameId(id)
    setSelectedGameName(name)
    setGameResults([])
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)
      setCropType('banner')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropper(true)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)
      setCropType('logo')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropper(true)
    }
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || !originalImageUrl) return

    try {
      const croppedImageBlob = await getCroppedImg(originalImageUrl, croppedAreaPixels)
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
      
      if (cropType === 'logo') {
        setLogoPreview(croppedImageUrl)
        setLogoFile(new File([croppedImageBlob], 'logo.jpg', { type: 'image/jpeg' }))
      } else {
        setPosterPreview(croppedImageUrl)
        setPosterFile(new File([croppedImageBlob], 'banner.jpg', { type: 'image/jpeg' }))
      }
      
      setShowCropper(false)
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
        setOriginalImageUrl(null)
      }
    } catch (error) {
      console.error('Erreur lors du crop:', error)
      notify({ type: 'error', message: 'Erreur lors du traitement de l\'image' })
    }
  }

  const handleNext = () => {
    if (step === 0) {
      // Vérifier qu'un jeu est sélectionné
      if (!selectedGameId) {
        notify({ type: 'error', message: '❌ Veuillez sélectionner un jeu' })
        return
      }
      setStep(1)
    } else if (step === 1) {
      // Vérifier que le nom est rempli
      if (!form.name.trim()) {
        notify({ type: 'error', message: '❌ Veuillez entrer un nom pour le tournoi' })
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    } else if (step === 4) {
      setStep(5)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier si l'utilisateur est connecté
    if (!session) {
      // Sauvegarder l'état actuel dans localStorage avant d'ouvrir la modale d'auth
      saveToLocalStorage()
      // Stocker l'URL de retour pour revenir à la création après connexion
      try {
        localStorage.setItem('lt_returnTo', window.location.pathname)
      } catch {}
      openAuthModal('login')
      notify({ type: 'info', message: '🔐 Veuillez vous connecter pour créer un tournoi' })
      return
    }
    
    if (!selectedGameId || !selectedGameName) {
      notify({ type: 'error', message: '❌ Veuillez choisir un jeu' })
      return
    }
    if (!form.name.trim()) {
      notify({ type: 'error', message: '❌ Veuillez entrer un nom pour le tournoi' })
      return
    }
    
    setIsLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.description) fd.append('description', form.description)
      fd.append('game', selectedGameName)
      fd.append('gameId', selectedGameId)
      fd.append('format', form.format)
      fd.append('visibility', form.visibility)
      fd.append('isTeamBased', String(form.isTeamBased === 'team'))
      
      if (form.isTeamBased === 'team') {
        if (form.teamMinSize) fd.append('teamMinSize', form.teamMinSize)
        if (form.teamMaxSize) fd.append('teamMaxSize', form.teamMaxSize)
      }
      
      if (form.startDate) fd.append('startDate', form.startDate)
      
      if (posterFile) fd.append('poster', posterFile)
      if (logoFile) fd.append('logo', logoFile)
      
      const res = await fetch('/api/tournaments', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        if (res.status === 409) {
          notify({ type: 'error', message: '⚠️ Limite atteinte ! Vous ne pouvez pas avoir plus de 10 tournois actifs simultanément.' })
          return
        }
        throw new Error(data.message || 'Erreur à la création')
      }
      const data = await res.json()
      // Supprimer les données sauvegardées après création réussie
      localStorage.removeItem(STORAGE_KEY)
      try {
        localStorage.removeItem('lt_returnTo')
      } catch {}
      notify({ type: 'success', message: '🎉 Tournoi créé avec succès !' })
      onClose()
      setTimeout(() => {
        router.push(`/tournaments/${data.tournament.id}`)
      }, 500)
    } catch (err) {
      notify({ type: 'error', message: `❌ ${(err as Error).message}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    // Sauvegarder l'état avant de fermer (sauf si on vient de créer le tournoi)
    saveToLocalStorage()
    // Réinitialiser après fermeture (mais garder le localStorage pour reprendre plus tard)
    setTimeout(() => {
      setStep(0)
      setForm({
        name: '',
        description: '',
        game: '',
        format: 'SINGLE_ELIMINATION',
        visibility: 'PUBLIC',
        isTeamBased: 'solo',
        teamMinSize: '',
        teamMaxSize: '',
        startDate: ''
      })
      setSelectedGameId(null)
      setSelectedGameName('')
      setGameQuery('')
      setGameResults([])
      setPosterFile(null)
      setPosterPreview(null)
      setLogoFile(null)
      setLogoPreview(null)
      setIsClosing(false)
      setShowCropper(false)
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl)
      if (posterPreview) URL.revokeObjectURL(posterPreview)
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      onClose()
    }, 300)
  }

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      if (posterPreview) URL.revokeObjectURL(posterPreview)
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl)
    }
  }, [logoPreview, posterPreview, originalImageUrl])

  if (!isOpen && !isClosing) return null

  const gameLogo = selectedGameId ? getGameLogoPath(selectedGameName) : null
  const gamePoster = selectedGameId ? getGamePosterPath(selectedGameName) : null

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalOverlayClosing : ''}`} onClick={handleClose}>
      <div className={`${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fermer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Bannière avec logo du jeu - affichée seulement si un jeu est sélectionné */}
        {selectedGameId && gamePoster && (
          <div className={styles.banner}>
            <div className={styles.bannerImage} style={{ backgroundImage: `url(${gamePoster})` }} />
            <div className={styles.bannerFade} />
            {gameLogo && (
              <div className={styles.bannerLogo}>
                <img src={gameLogo} alt={selectedGameName} />
                <span className={styles.bannerGameName}>{selectedGameName.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.modalBody}>
          <h1 className={styles.modalTitle}>Créer un tournoi</h1>

          {/* Indicateur de progression */}
          <div className={styles.progressIndicator}>
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 0 ? styles.progressDotActive : ''} ${step > 0 ? styles.progressDotCompleted : ''}`}>
                {step > 0 ? '✓' : '1'}
              </div>
              <span className={`${styles.progressLabel} ${step >= 0 ? styles.progressLabelActive : ''}`}>Jeu</span>
            </div>
            <div className={`${styles.progressLine} ${step > 0 ? styles.progressLineActive : ''}`} />
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 1 ? styles.progressDotActive : ''} ${step > 1 ? styles.progressDotCompleted : ''}`}>
                {step > 1 ? '✓' : '2'}
              </div>
              <span className={`${styles.progressLabel} ${step >= 1 ? styles.progressLabelActive : ''}`}>Général</span>
            </div>
            <div className={`${styles.progressLine} ${step > 1 ? styles.progressLineActive : ''}`} />
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 2 ? styles.progressDotActive : ''} ${step > 2 ? styles.progressDotCompleted : ''}`}>
                {step > 2 ? '✓' : '3'}
              </div>
              <span className={`${styles.progressLabel} ${step >= 2 ? styles.progressLabelActive : ''}`}>Format</span>
            </div>
            <div className={`${styles.progressLine} ${step > 2 ? styles.progressLineActive : ''}`} />
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 3 ? styles.progressDotActive : ''} ${step > 3 ? styles.progressDotCompleted : ''}`}>
                {step > 3 ? '✓' : '4'}
              </div>
              <span className={`${styles.progressLabel} ${step >= 3 ? styles.progressLabelActive : ''}`}>Date</span>
            </div>
            <div className={`${styles.progressLine} ${step > 3 ? styles.progressLineActive : ''}`} />
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 4 ? styles.progressDotActive : ''} ${step > 4 ? styles.progressDotCompleted : ''}`}>
                {step > 4 ? '✓' : '5'}
              </div>
              <span className={`${styles.progressLabel} ${step >= 4 ? styles.progressLabelActive : ''}`}>Visuel</span>
            </div>
            <div className={`${styles.progressLine} ${step > 4 ? styles.progressLineActive : ''}`} />
            <div className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= 5 ? styles.progressDotActive : ''}`}>
                6
              </div>
              <span className={`${styles.progressLabel} ${step >= 5 ? styles.progressLabelActive : ''}`}>Récapitulatif</span>
            </div>
          </div>

          {/* Étape 0: Jeu */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Sélection du jeu</h2>
              <p className={styles.stepSubtitle}>Choisissez le jeu pour votre tournoi</p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rechercher un jeu</label>
                <input
                  className={styles.input}
                  type="text"
                  value={gameQuery}
                  onChange={handleGameInput}
                  placeholder="Rechercher un jeu..."
                />
                {gameQuery.length >= 2 && gameResults.length > 0 && (
                  <div className={styles.gameResults}>
                    {gameResults.map(g => (
                      <div
                        key={g.id}
                        className={styles.gameResultItem}
                        onClick={() => handlePickGame(g.name, g.id)}
                      >
                        {g.image && <img src={g.image} alt={g.name} className={styles.gameResultImage} />}
                        <span>{g.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!gameQuery && allGames.length > 0 && (
                  <div className={styles.gamesGrid}>
                    {allGames.map(g => (
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
                )}
              </div>
            </div>
          )}

          {/* Étape 1: General */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Informations générales</h2>
              <p className={styles.stepSubtitle}>Informations de base sur votre tournoi</p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nom du tournoi</label>
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Tournoi d'été 2024"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre tournoi..."
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Organisé par</label>
                <div className={styles.hostedBy}>
                  <div className={styles.hostedByUser}>
                    <div className={styles.hostedByIcon}>👤</div>
                    <span>{userPseudo || (session?.user as any)?.pseudo || 'Utilisateur'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Format */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Format du tournoi</h2>
              <p className={styles.stepSubtitle}>Configurez le format et les paramètres des équipes</p>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Type de compétition</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="isTeamBased"
                        value="solo"
                        checked={form.isTeamBased === 'solo'}
                        onChange={(e) => setForm(prev => ({ ...prev, isTeamBased: e.target.value }))}
                      />
                      <span>Solo</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="isTeamBased"
                        value="team"
                        checked={form.isTeamBased === 'team'}
                        onChange={(e) => setForm(prev => ({ ...prev, isTeamBased: e.target.value }))}
                      />
                      <span>Équipe</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Format</label>
                  <select className={styles.select} name="format" value={form.format} onChange={handleChange}>
                    <option value="SINGLE_ELIMINATION">Élimination directe</option>
                    <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                    <option value="ROUND_ROBIN" disabled>Round robin (bientôt)</option>
                  </select>
                </div>
              </div>

              {form.isTeamBased === 'team' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Joueurs par équipe</label>
                  <div className={styles.radioGroup}>
                    {['2v2', '3v3', '4v4', '5v5'].map((format) => {
                      const players = format.split('v')[0]
                      return (
                        <label key={format} className={styles.radioOption}>
                          <input
                            type="radio"
                            name="playersPerTeam"
                            value={players}
                            checked={form.teamMinSize === players && form.teamMaxSize === players}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm(prev => ({ ...prev, teamMinSize: val, teamMaxSize: val }))
                            }}
                          />
                          <span>{format}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Visibilité</label>
                <select className={styles.select} name="visibility" value={form.visibility} onChange={handleChange}>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>
            </div>
          )}

          {/* Étape 3: Date */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Date et heure</h2>
              <p className={styles.stepSubtitle}>Choisissez la date de début de votre tournoi (optionnel)</p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date de début</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Étape 4: Visuel */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Visuels</h2>
              <p className={styles.stepSubtitle}>Personnalisez l'apparence de votre tournoi</p>

              {/* Système visuel comme dans la page admin */}
              <div className={styles.visualsSection}>
                <div className={styles.visualsHeader}>
                  <div 
                    className={styles.visualsBanner}
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${posterPreview || gamePoster || '/images/games.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className={styles.visualsBannerOverlay}>
                      <button 
                        type="button"
                        className={styles.visualsBannerButton}
                        onClick={() => document.getElementById('banner-input-modal')?.click()}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        Modifier la bannière
                      </button>
                    </div>
                    <input
                      id="banner-input-modal"
                      type="file"
                      accept="image/*"
                      onChange={handlePosterChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  <div className={styles.visualsAvatarWrapper}>
                    <div className={styles.visualsAvatarContainer}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className={styles.visualsAvatar} />
                      ) : gameLogo ? (
                        <img src={gameLogo} alt="Logo du jeu" className={styles.visualsAvatar} />
                      ) : (
                        <div className={styles.visualsAvatarPlaceholder}>
                          🎮
                        </div>
                      )}
                      <button 
                        type="button"
                        className={styles.visualsAvatarButton}
                        onClick={() => document.getElementById('logo-input-modal')?.click()}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                      </button>
                      <input
                        id="logo-input-modal"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(posterPreview || logoPreview) && (
                  <div className={styles.visualsActions}>
                    {posterPreview && (
                      <div className={styles.visualsActionGroup}>
                        <span className={styles.visualsActionLabel}>Bannière modifiée</span>
                        <button 
                          type="button"
                          className={styles.cancelButton}
                          onClick={() => {
                            if (posterPreview) URL.revokeObjectURL(posterPreview)
                            if (originalImageUrl && cropType === 'banner') {
                              URL.revokeObjectURL(originalImageUrl)
                              setOriginalImageUrl(null)
                            }
                            setPosterPreview(null)
                            setPosterFile(null)
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                    {logoPreview && (
                      <div className={styles.visualsActionGroup}>
                        <span className={styles.visualsActionLabel}>Logo modifié</span>
                        <button 
                          type="button"
                          className={styles.cancelButton}
                          onClick={() => {
                            if (logoPreview) URL.revokeObjectURL(logoPreview)
                            if (originalImageUrl && cropType === 'logo') {
                              URL.revokeObjectURL(originalImageUrl)
                              setOriginalImageUrl(null)
                            }
                            setLogoPreview(null)
                            setLogoFile(null)
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Étape 5: Récapitulatif */}
          {step === 5 && (
            <div className={styles.stepContent}>
              <div className={styles.summaryHeader}>
                <h2 className={styles.stepTitle}>Récapitulatif</h2>
                <p className={styles.stepSubtitle}>Vérifiez les informations avant de créer votre tournoi</p>
              </div>

              {/* Aperçu de la card en premier */}
              {form.name && selectedGameName && (
                <div className={styles.summaryCardPreview}>
                  <div className={styles.summaryCardPreviewHeader}>
                    <span className={styles.summaryCardPreviewIcon}>👁️</span>
                    <h3 className={styles.summaryCardPreviewTitle}>Aperçu</h3>
                  </div>
                  <div className={styles.cardPreviewWrapper}>
                    <TournamentCard
                      tournament={{
                        id: 'preview',
                        name: form.name,
                        description: form.description,
                        game: selectedGameName,
                        gameRef: {
                          id: selectedGameId || '',
                          name: selectedGameName,
                          imageUrl: gamePoster || null
                        },
                        posterUrl: posterPreview || null,
                        logoUrl: logoPreview || null,
                        startDate: form.startDate || null,
                        endDate: null,
                        createdAt: new Date().toISOString(),
                        status: 'DRAFT',
                        format: form.format,
                        isTeamBased: form.isTeamBased === 'team',
                        teamMinSize: form.teamMinSize ? parseInt(form.teamMinSize) : null,
                        teamMaxSize: form.teamMaxSize ? parseInt(form.teamMaxSize) : null,
                        organizer: session?.user ? {
                          id: (session.user as any).id,
                          pseudo: userPseudo || (session.user as any).name || 'Organisateur',
                          avatarUrl: null
                        } : null,
                        _count: {
                          registrations: 0
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Informations récapitulatives en grille */}
              <div className={styles.summaryGrid}>
                {/* Jeu */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardHeader}>
                    <span className={styles.summaryCardIcon}>🎮</span>
                    <h3 className={styles.summaryCardTitle}>Jeu</h3>
                  </div>
                  <div className={styles.summaryCardContent}>
                    {gamePoster && (
                      <div className={styles.summaryGameImage}>
                        <img src={gamePoster} alt={selectedGameName} />
                      </div>
                    )}
                    <div className={styles.summaryGameName}>{selectedGameName}</div>
                  </div>
                </div>

                {/* Informations générales */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardHeader}>
                    <span className={styles.summaryCardIcon}>📋</span>
                    <h3 className={styles.summaryCardTitle}>Informations</h3>
                  </div>
                  <div className={styles.summaryCardContent}>
                    <div className={styles.summaryInfoRow}>
                      <span className={styles.summaryInfoLabel}>Nom</span>
                      <span className={styles.summaryInfoValue}>{form.name}</span>
                    </div>
                    {form.description && (
                      <div className={styles.summaryInfoRow}>
                        <span className={styles.summaryInfoLabel}>Description</span>
                        <p className={styles.summaryInfoDescription}>{form.description}</p>
                      </div>
                    )}
                    <div className={styles.summaryInfoRow}>
                      <span className={styles.summaryInfoLabel}>Organisé par</span>
                      <div className={styles.summaryOrganizer}>
                        <span className={styles.summaryOrganizerIcon}>👤</span>
                        <span className={styles.summaryInfoValue}>{userPseudo || (session?.user as any)?.pseudo || 'Utilisateur'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardHeader}>
                    <span className={styles.summaryCardIcon}>⚙️</span>
                    <h3 className={styles.summaryCardTitle}>Format</h3>
                  </div>
                  <div className={styles.summaryCardContent}>
                    <div className={styles.summaryBadges}>
                      <span className={`${styles.summaryBadge} ${form.isTeamBased === 'team' ? styles.summaryBadgeTeam : styles.summaryBadgeSolo}`}>
                        {form.isTeamBased === 'team' ? '👥 Équipe' : '🎯 Solo'}
                      </span>
                      {form.isTeamBased === 'team' && form.teamMinSize && form.teamMaxSize && (
                        <span className={styles.summaryBadge}>
                          {form.teamMinSize === form.teamMaxSize ? `${form.teamMinSize}v${form.teamMaxSize}` : `${form.teamMinSize}-${form.teamMaxSize}`}
                        </span>
                      )}
                      <span className={styles.summaryBadge}>
                        {form.format === 'SINGLE_ELIMINATION' ? '🏆 Élimination directe' : form.format}
                      </span>
                      <span className={`${styles.summaryBadge} ${form.visibility === 'PUBLIC' ? styles.summaryBadgePublic : styles.summaryBadgePrivate}`}>
                        {form.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Privé'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                {form.startDate && (
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryCardIcon}>📅</span>
                      <h3 className={styles.summaryCardTitle}>Date</h3>
                    </div>
                    <div className={styles.summaryCardContent}>
                      <div className={styles.summaryDate}>
                        <div className={styles.summaryDateValue}>
                          {new Date(form.startDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className={styles.summaryDateTime}>
                          {new Date(form.startDate).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visuels */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardHeader}>
                    <span className={styles.summaryCardIcon}>🎨</span>
                    <h3 className={styles.summaryCardTitle}>Visuels</h3>
                  </div>
                  <div className={styles.summaryCardContent}>
                    <div className={styles.summaryVisuals}>
                      <div className={styles.summaryVisualItem}>
                        <span className={styles.summaryVisualLabel}>Bannière</span>
                        <span className={`${styles.summaryVisualBadge} ${posterPreview ? styles.summaryVisualBadgeCustom : ''}`}>
                          {posterPreview ? '✨ Personnalisée' : '🎨 Par défaut'}
                        </span>
                      </div>
                      <div className={styles.summaryVisualItem}>
                        <span className={styles.summaryVisualLabel}>Logo</span>
                        <span className={`${styles.summaryVisualBadge} ${logoPreview ? styles.summaryVisualBadgeCustom : ''}`}>
                          {logoPreview ? '✨ Personnalisé' : '🎨 Par défaut'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.modalActions}>
            {step > 0 && (
              <button type="button" className={styles.backButton} onClick={handleBack}>
                Retour
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                className={styles.nextButton}
                onClick={handleNext}
                disabled={
                  (step === 0 && !selectedGameId) ||
                  (step === 1 && !form.name.trim())
                }
              >
                Suivant
              </button>
            ) : (
              !session ? (
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={() => {
                    // Sauvegarder l'état actuel avant d'ouvrir la modale d'auth
                    saveToLocalStorage()
                    try {
                      localStorage.setItem('lt_returnTo', window.location.pathname)
                    } catch {}
                    openAuthModal('login')
                    notify({ type: 'info', message: '🔐 Veuillez vous connecter pour créer un tournoi' })
                  }}
                >
                  Se connecter
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={handleSubmit}
                  disabled={isLoading || !selectedGameId || !form.name.trim()}
                >
                  {isLoading ? 'Création...' : 'Créer le tournoi'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
