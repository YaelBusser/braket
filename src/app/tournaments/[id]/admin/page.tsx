'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useNotification } from '../../../../components/providers/notification-provider'
import ClientPageWrapper from '../../../../components/ClientPageWrapper'
import Link from 'next/link'
import Cropper from 'react-easy-crop'
import styles from './page.module.scss'
import { getGameLogoPath } from '@/utils/gameLogoUtils'
import { getCroppedImg } from '@/lib/image'
import VisualsIcon from '../../../../components/icons/VisualsIcon'
import SettingsIcon from '../../../../components/icons/SettingsIcon'

interface Tournament {
  id: string
  name: string
  description: string | null
  game: string | null
  logoUrl: string | null
  category: string
  format: string
  visibility: string
  status: string
  isTeamBased: boolean
  maxParticipants: number | null
  teamMinSize: number | null
  teamMaxSize: number | null
  bracketMinTeams: number | null
  bracketMaxTeams: number | null
  startDate: string | null
  endDate: string | null
  registrationDeadline: string | null
  posterUrl: string | null
  createdAt: string
  updatedAt: string
  _count: {
    registrations: number
    teams: number
    matches: number
  }
  teams: Array<{
    id: string
    name: string
    members: Array<{
      id: string
      user: {
        id: string
        pseudo: string
        avatarUrl: string | null
      }
    }>
  }>
  matches: Array<{
    id: string
    round: number | null
    status: string
    teamA: { id: string; name: string }
    teamB: { id: string; name: string }
    winnerTeam: { id: string; name: string } | null
    scheduledAt: string | null
  }>
}

export default function TournamentAdminPage() {
  return <TournamentAdminContent />
}

function BracketSettingsSection({ 
  tournament, 
  onUpdate, 
  notify 
}: { 
  tournament: Tournament | null
  onUpdate: (tournament: Tournament) => void
  notify: (notification: { type: string; message: string }) => void
}) {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const [minTeams, setMinTeams] = useState(tournament?.bracketMinTeams || 2)
  const [maxTeams, setMaxTeams] = useState(tournament?.bracketMaxTeams || 8)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ min?: string; max?: string }>({})

  const validMaxValues = [2, 4, 8, 16, 32, 64, 128, 256]

  useEffect(() => {
    if (tournament) {
      setMinTeams(tournament.bracketMinTeams || 2)
      setMaxTeams(tournament.bracketMaxTeams || 8)
    }
  }, [tournament])

  const validate = (min: number, max: number) => {
    const newErrors: { min?: string; max?: string } = {}
    
    if (min < 2) {
      newErrors.min = 'Le minimum doit être au moins 2'
    }
    
    if (!validMaxValues.includes(max)) {
      newErrors.max = `Le maximum doit être l'un des suivants: ${validMaxValues.join(', ')}`
    }
    
    if (min > max) {
      newErrors.min = 'Le minimum ne peut pas être supérieur au maximum'
      newErrors.max = 'Le maximum ne peut pas être inférieur au minimum'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!tournament) return
    
    if (!validate(minTeams, maxTeams)) {
      notify({ type: 'error', message: 'Veuillez corriger les erreurs avant de sauvegarder' })
      return
    }

    // Vérifier que le tournoi n'a pas encore commencé
    if (tournament.status !== 'REG_OPEN') {
      notify({ type: 'error', message: 'Impossible de modifier le bracket : le tournoi a déjà commencé' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bracketMinTeams: minTeams,
          bracketMaxTeams: maxTeams
        })
      })

      const data = await res.json()
      if (res.ok) {
        onUpdate(data.tournament)
        notify({ type: 'success', message: 'Paramètres du bracket mis à jour avec succès !' })
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur de connexion' })
    } finally {
      setSaving(false)
    }
  }

  if (!tournament) return null

  const canEdit = tournament.status === 'REG_OPEN'

  return (
    <div className={styles.bracketSettings}>
      <div className={styles.bracketSettingsInfo}>
        <p className={styles.bracketSettingsDescription}>
          Configurez les paramètres du bracket d'élimination simple. Ces paramètres peuvent être modifiés uniquement tant que le tournoi n'a pas commencé.
        </p>
        {!canEdit && (
          <div className={styles.bracketSettingsWarning}>
            ⚠️ Le tournoi a déjà commencé. Les paramètres du bracket ne peuvent plus être modifiés.
          </div>
        )}
      </div>

      <div className={styles.bracketSettingsGrid}>
        <div className={styles.bracketSettingField}>
          <label className={styles.bracketSettingLabel}>
            Minimum teams
          </label>
          <input
            type="number"
            min="2"
            value={minTeams}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 2
              setMinTeams(val)
              validate(val, maxTeams)
            }}
            disabled={!canEdit || saving}
            className={`${styles.bracketSettingInput} ${errors.min ? styles.inputError : ''}`}
          />
          {errors.min && (
            <div className={styles.fieldError}>{errors.min}</div>
          )}
          <div className={styles.bracketSettingHelp}>
            Minimum number of teams required to start the tournament.
          </div>
        </div>

        <div className={styles.bracketSettingField}>
          <label className={styles.bracketSettingLabel}>
            Maximum teams
          </label>
          <div className={styles.bracketSettingMaxContainer}>
            <div className={styles.bracketSettingMaxOptions}>
              {validMaxValues.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setMaxTeams(val)
                    validate(minTeams, val)
                  }}
                  disabled={!canEdit || saving}
                  className={`${styles.bracketSettingMaxOption} ${maxTeams === val ? styles.bracketSettingMaxOptionActive : ''}`}
                >
                  {val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={maxTeams}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 8
                setMaxTeams(val)
                validate(minTeams, val)
              }}
              disabled={!canEdit || saving}
              className={`${styles.bracketSettingInput} ${errors.max ? styles.inputError : ''}`}
            />
          </div>
          {errors.max && (
            <div className={styles.fieldError}>{errors.max}</div>
          )}
          <div className={styles.bracketSettingHelp}>
            Maximum number of teams of the bracket.
          </div>
        </div>
      </div>

      {canEdit && (
        <div className={styles.bracketSettingsActions}>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(errors).length > 0}
            className={styles.saveButton}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
}

function TournamentAdminContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'participants' | 'matches' | 'visuals' | 'bracket' | 'settings'>('overview')
  const { notify } = useNotification()
  
  // États pour les visuels
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<File | null>(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [isLoadingVisuals, setIsLoadingVisuals] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/tournaments/${id}`)
        const data = await res.json()
        if (res.ok) {
          setTournament(data.tournament)
        } else {
          notify({ type: 'error', message: data.message || 'Erreur lors du chargement' })
        }
      } catch (error) {
        notify({ type: 'error', message: 'Erreur de connexion' })
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, notify])

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement ce tournoi ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        notify({ type: 'success', message: 'Tournoi supprimé avec succès' })
        router.replace('/my-tournaments')
      } else {
        const d = await res.json().catch(() => ({}))
        notify({ type: 'error', message: d.message || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur de connexion' })
    } finally {
      setDeleting(false)
    }
  }

  const callAction = async (mode: 'open_reg' | 'close_reg' | 'finish') => {
    try {
      const res = await fetch(`/api/tournaments/${id}?mode=${mode}`, { method: 'PUT' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setTournament(d.tournament)
        const messages = {
          open_reg: '🎉 Inscriptions ouvertes ! Les participants peuvent maintenant s\'inscrire au tournoi.',
          close_reg: '🚀 Tournoi démarré ! Le bracket a été généré et les matchs sont prêts.',
          finish: '🏆 Tournoi terminé ! Félicitations à tous les participants.'
        }
        notify({ type: 'success', message: messages[mode] })
        if (mode === 'close_reg') {
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        const errorMessages = {
          open_reg: '❌ Impossible d\'ouvrir les inscriptions. Vérifiez les paramètres du tournoi.',
          close_reg: '❌ Impossible de démarrer le tournoi. Assurez-vous qu\'il y a au moins 2 participants.',
          finish: '❌ Impossible de terminer le tournoi. Vérifiez que tous les matchs sont terminés.'
        }
        notify({ type: 'error', message: d.message || errorMessages[mode] || 'Action impossible' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur de connexion. Vérifiez votre connexion internet.' })
    }
  }

  const validateMatchResult = async (matchId: string, winnerTeamId: string) => {
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winnerTeamId })
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        notify({ type: 'success', message: '✅ Résultat validé ! Le vainqueur avance au tour suivant.' })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        notify({ type: 'error', message: d.message || '❌ Erreur lors de la validation du résultat' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur de connexion lors de la validation' })
    }
  }

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl)
    }
  }, [logoPreviewUrl, bannerPreviewUrl, originalImageUrl])

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedLogo(file)
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)
      setCropType('logo')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropper(true)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedBanner(file)
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)
      setCropType('banner')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropper(true)
    }
  }

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || !originalImageUrl) return

    try {
      const croppedImageBlob = await getCroppedImg(originalImageUrl, croppedAreaPixels)
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
      
      if (cropType === 'logo') {
        setLogoPreviewUrl(croppedImageUrl)
      } else {
        setBannerPreviewUrl(croppedImageUrl)
      }
      
      setShowCropper(false)
    } catch (error) {
      console.error('Erreur lors du crop:', error)
      notify({ type: 'error', message: 'Erreur lors du traitement de l\'image' })
    }
  }

  const handleSaveLogo = async () => {
    if (!logoPreviewUrl) return

    setIsLoadingVisuals(true)
    try {
      const formData = new FormData()
      const response = await fetch(logoPreviewUrl)
      const blob = await response.blob()
      formData.append('logo', blob, 'logo.jpg')

      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        setTournament(result.tournament)
        notify({ type: 'success', message: 'Logo mis à jour avec succès ! 🎉' })
        URL.revokeObjectURL(logoPreviewUrl)
        if (originalImageUrl && cropType === 'logo') {
          URL.revokeObjectURL(originalImageUrl)
        }
        setLogoPreviewUrl(null)
        setSelectedLogo(null)
        setOriginalImageUrl(null)
      } else {
        const error = await res.json().catch(() => ({}))
        notify({ type: 'error', message: error.message || 'Erreur lors de la mise à jour du logo' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors de la mise à jour du logo' })
    } finally {
      setIsLoadingVisuals(false)
    }
  }

  const handleSaveBanner = async () => {
    if (!bannerPreviewUrl) return

    setIsLoadingVisuals(true)
    try {
      const formData = new FormData()
      const response = await fetch(bannerPreviewUrl)
      const blob = await response.blob()
      formData.append('poster', blob, 'banner.jpg')

      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        setTournament(result.tournament)
        notify({ type: 'success', message: 'Bannière mise à jour avec succès ! 🎉' })
        if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
        if (originalImageUrl && cropType === 'banner') {
          URL.revokeObjectURL(originalImageUrl)
        }
        setBannerPreviewUrl(null)
        setSelectedBanner(null)
        setOriginalImageUrl(null)
      } else {
        const error = await res.json().catch(() => ({}))
        notify({ type: 'error', message: error.message || 'Erreur lors de la mise à jour de la bannière' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors de la mise à jour de la bannière' })
    } finally {
      setIsLoadingVisuals(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.loadingState}>
          Chargement...
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.loadingState}>
          Tournoi introuvable
        </div>
      </div>
    )
  }

  const gameName = tournament.game || ''
  const gameLogoPath = getGameLogoPath(gameName)

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            {tournament.logoUrl || gameLogoPath ? (
              <div className={styles.sidebarLogo}>
                <img src={tournament.logoUrl || gameLogoPath || ''} alt={tournament.name} />
              </div>
            ) : (
              <div className={styles.sidebarLogoPlaceholder}>
                🎮
              </div>
            )}
            <div className={styles.sidebarTournamentInfo}>
              <div className={styles.sidebarTournamentName}>
              {tournament.name}
              </div>
              <button 
                className={styles.viewTournamentLink}
                onClick={() => router.push(`/tournaments/${id}`)}
              >
                ← Voir le tournoi
              </button>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            <div className={styles.navSection}>
              <button
                className={`${styles.navItem} ${activeSection === 'overview' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('overview')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Vue d'ensemble</span>
              </button>
              <button
                className={`${styles.navItem} ${activeSection === 'participants' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('participants')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{tournament.isTeamBased ? 'Équipes' : 'Participants'}</span>
              </button>
              <button
                className={`${styles.navItem} ${activeSection === 'matches' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('matches')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Matchs</span>
              </button>
        </div>
        
            <div className={styles.navSection}>
              <button
                className={`${styles.navItem} ${activeSection === 'visuals' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('visuals')}
              >
                <VisualsIcon width={20} height={20} />
                <span>Visuels</span>
              </button>
            </div>

            <div className={styles.navSection}>
              <div className={styles.navSectionTitle}>PARAMÈTRES</div>
              <button
                className={`${styles.navItem} ${activeSection === 'bracket' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('bracket')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>Bracket</span>
              </button>
              <button
                className={`${styles.navItem} ${activeSection === 'settings' ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection('settings')}
              >
                <SettingsIcon width={20} height={20} />
                <span>Paramètres</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {activeSection === 'overview' && (
            <div className={styles.contentSection}>
              <h1 className={styles.contentTitle}>Vue d'ensemble</h1>
              
              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{tournament._count.registrations}</div>
                  <div className={styles.statLabel}>
                    {tournament.isTeamBased ? 'Équipes' : 'Participants'}
            </div>
          </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: 'var(--lt-success)' }}>
              {tournament._count.matches}
            </div>
                  <div className={styles.statLabel}>Matchs</div>
            </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: 'var(--lt-warning)' }}>
              {tournament.maxParticipants || '∞'}
            </div>
                  <div className={styles.statLabel}>Max participants</div>
        </div>
      </div>

              {/* Actions */}
              <h2 className={styles.contentTitle} style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
                Actions rapides
              </h2>
              <div className={styles.actionsGrid}>
              <button
                onClick={() => callAction('open_reg')}
                disabled={tournament.status === 'REG_OPEN'}
                  className={`${styles.actionButton} ${styles.success}`}
              >
                Ouvrir inscriptions
              </button>
              <button
                onClick={() => callAction('close_reg')}
                disabled={tournament.status !== 'REG_OPEN'}
                  className={`${styles.actionButton} ${styles.warning}`}
              >
                Démarrer tournoi
              </button>
              <button
                onClick={() => callAction('finish')}
                disabled={tournament.status === 'COMPLETED'}
                  className={`${styles.actionButton} ${styles.danger}`}
              >
                Terminer tournoi
              </button>
            </div>

              {/* Info Cards */}
              <h2 className={styles.contentTitle} style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
                Informations du tournoi
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <h3 className={styles.infoCardTitle}>Détails</h3>
                  <div className={styles.infoCardContent}>
                  <div><strong>Catégorie:</strong> {tournament.category}</div>
                  <div><strong>Format:</strong> {tournament.format}</div>
                  <div><strong>Visibilité:</strong> {tournament.visibility}</div>
                  <div><strong>Type:</strong> {tournament.isTeamBased ? 'Équipes' : 'Solo'}</div>
                </div>
              </div>
                <div className={styles.infoCard}>
                  <h3 className={styles.infoCardTitle}>Dates</h3>
                  <div className={styles.infoCardContent}>
                  <div><strong>Début:</strong> {tournament.startDate ? new Date(tournament.startDate).toLocaleString('fr-FR') : '—'}</div>
                  <div><strong>Fin:</strong> {tournament.endDate ? new Date(tournament.endDate).toLocaleString('fr-FR') : '—'}</div>
                  <div><strong>Clôture:</strong> {tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

          {activeSection === 'participants' && (
            <div className={styles.contentSection}>
              <h1 className={styles.contentTitle}>
              {tournament.isTeamBased ? 'Équipes' : 'Participants'} ({tournament._count.registrations})
              </h1>
            {tournament.teams && tournament.teams.length > 0 ? (
                <div className={styles.participantsList}>
                {tournament.teams.map((team) => (
                    <div key={team.id} className={styles.participantCard}>
                      <div className={styles.participantHeader}>
                        <h3 className={styles.participantName}>{team.name}</h3>
                        <span className={styles.participantBadge}>
                        {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                      </span>
                    </div>
                      <div className={styles.membersList}>
                      {team.members.map((member) => (
                          <div key={member.id} className={styles.memberItem}>
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.pseudo}
                                className={styles.memberAvatar}
                            />
                          ) : (
                              <div className={styles.memberAvatarPlaceholder}>
                              {member.user.pseudo.charAt(0).toUpperCase()}
                            </div>
                          )}
                            <span className={styles.memberName}>{member.user.pseudo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className={styles.emptyState}>
                Aucun {tournament.isTeamBased ? 'équipe' : 'participant'} inscrit
              </div>
            )}
          </div>
        )}

          {activeSection === 'matches' && (
            <div className={styles.contentSection}>
              <h1 className={styles.contentTitle}>Matchs ({tournament._count.matches})</h1>
            {tournament.matches && tournament.matches.length > 0 ? (
                <div className={styles.matchesList}>
                {tournament.matches.map((match) => (
                    <div key={match.id} className={styles.matchCard}>
                      <div className={styles.matchHeader}>
                        <span className={`${styles.matchStatus} ${
                          match.status === 'COMPLETED' ? styles.completed :
                          match.status === 'SCHEDULED' ? styles.scheduled :
                          styles.pending
                        }`}>
                        {match.status === 'COMPLETED' ? 'Terminé' : match.status === 'SCHEDULED' ? 'Programmé' : 'En attente'}
                      </span>
                      {match.round && (
                          <span className={styles.matchRound}>Tour {match.round}</span>
                      )}
                    </div>
                      <div className={styles.matchTeams}>
                        <div className={`${styles.matchTeam} ${
                          match.winnerTeam?.id === match.teamA.id ? styles.winner : styles.default
                        }`}>
                          {match.teamA.name}
                        </div>
                        <div className={styles.matchVS}>VS</div>
                        <div className={`${styles.matchTeam} ${
                          match.winnerTeam?.id === match.teamB.id ? styles.winner : styles.default
                        }`}>
                          {match.teamB.name}
                      </div>
                    </div>
                    
                    {match.winnerTeam ? (
                        <div className={styles.matchWinner}>
                        🏆 Vainqueur: {match.winnerTeam.name}
                      </div>
                    ) : match.status === 'PENDING' && tournament.status === 'IN_PROGRESS' && (
                        <div className={styles.matchActions}>
                        <button
                          onClick={() => validateMatchResult(match.id, match.teamA.id)}
                            className={styles.matchActionButton}
                        >
                          {match.teamA.name} gagne
                        </button>
                        <button
                          onClick={() => validateMatchResult(match.id, match.teamB.id)}
                            className={styles.matchActionButton}
                        >
                          {match.teamB.name} gagne
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
                <div className={styles.emptyState}>
                Aucun match généré
              </div>
            )}
          </div>
        )}

          {activeSection === 'visuals' && (
            <div className={styles.contentSection}>
              <div className={styles.profileHeaderSection}>
                <h1 className={styles.contentTitle}>Visuels</h1>
              </div>
              
              <div className={styles.visualsSection}>
                {/* Bannière avec logo par-dessus (comme la page de profil) */}
                <div className={styles.visualsHeader}>
                  <div 
                    className={styles.visualsBanner}
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerPreviewUrl || tournament.posterUrl || '/images/games.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className={styles.visualsBannerOverlay}>
                      <button 
                        className={styles.visualsBannerButton}
                        onClick={() => document.getElementById('banner-input-tournament')?.click()}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        Modifier la bannière
                      </button>
                    </div>
                    <input
                      id="banner-input-tournament"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  <div className={styles.visualsAvatarWrapper}>
                    <div className={styles.visualsAvatarContainer}>
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo preview" className={styles.visualsAvatar} />
                      ) : tournament.logoUrl ? (
                        <img src={tournament.logoUrl} alt="Logo actuel" className={styles.visualsAvatar} />
                      ) : gameLogoPath ? (
                        <img src={gameLogoPath} alt="Logo du jeu" className={styles.visualsAvatar} />
                      ) : (
                        <div className={styles.visualsAvatarPlaceholder}>
                          🎮
                        </div>
                      )}
                      <button 
                        className={styles.visualsAvatarButton}
                        onClick={() => document.getElementById('logo-input-tournament')?.click()}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                      </button>
                      <input
                        id="logo-input-tournament"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(bannerPreviewUrl || logoPreviewUrl) && (
                  <div className={styles.visualsActions}>
                    {bannerPreviewUrl && (
                      <div className={styles.visualsActionGroup}>
                        <span className={styles.visualsActionLabel}>Bannière modifiée</span>
                        <button 
                          className={styles.cancelButton}
                          onClick={() => {
                            if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
                            if (originalImageUrl && cropType === 'banner') {
                              URL.revokeObjectURL(originalImageUrl)
                              setOriginalImageUrl(null)
                            }
                            setBannerPreviewUrl(null)
                            setSelectedBanner(null)
                          }}
                        >
                          Annuler
                        </button>
                        <button 
                          className={styles.saveButton}
                          onClick={handleSaveBanner}
                          disabled={isLoadingVisuals}
                        >
                          {isLoadingVisuals ? 'Sauvegarde...' : 'Sauvegarder la bannière'}
                        </button>
                      </div>
                    )}
                    {logoPreviewUrl && (
                      <div className={styles.visualsActionGroup}>
                        <span className={styles.visualsActionLabel}>Logo modifié</span>
                        <button 
                          className={styles.cancelButton}
                          onClick={() => {
                            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
                            if (originalImageUrl && cropType === 'logo') {
                              URL.revokeObjectURL(originalImageUrl)
                              setOriginalImageUrl(null)
                            }
                            setLogoPreviewUrl(null)
                            setSelectedLogo(null)
                          }}
                        >
                          Annuler
                        </button>
                        <button 
                          className={styles.saveButton}
                          onClick={handleSaveLogo}
                          disabled={isLoadingVisuals}
                        >
                          {isLoadingVisuals ? 'Sauvegarde...' : 'Sauvegarder le logo'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'bracket' && (
            <div className={styles.contentSection}>
              <h1 className={styles.contentTitle}>Bracket</h1>
              
              <BracketSettingsSection 
                tournament={tournament} 
                onUpdate={(updated) => setTournament(updated)}
                notify={notify}
              />
            </div>
          )}

          {activeSection === 'settings' && (
            <div className={styles.contentSection}>
              <h1 className={styles.contentTitle}>Paramètres</h1>
              
              <div className={styles.dangerZone}>
                <h3 className={styles.dangerZoneTitle}>Supprimer le tournoi</h3>
                <p className={styles.dangerZoneDescription}>
                Cette action est irréversible. Tous les participants, équipes et matchs seront supprimés.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                  className={`${styles.actionButton} ${styles.danger}`}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Modal de crop */}
      {showCropper && originalImageUrl && (
        <div className={styles.cropModal}>
          <div className={styles.cropContainer}>
            <h2 className={styles.cropTitle}>
              {cropType === 'logo' ? 'Recadrer le logo' : 'Recadrer la bannière'}
            </h2>
            <div 
              className={styles.cropArea} 
              data-aspect={cropType === 'banner' ? 'banner' : undefined}
              data-crop-type={cropType === 'logo' ? 'avatar' : undefined}
            >
              <Cropper
                image={originalImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'logo' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape={cropType === 'logo' ? 'round' : 'rect'}
              />
            </div>
            <div className={styles.cropControls}>
              <div className={styles.cropZoomControl}>
                <label>Zoom:</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className={styles.cropButtons}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowCropper(false)
                    if (originalImageUrl) {
                      URL.revokeObjectURL(originalImageUrl)
                    }
                    setOriginalImageUrl(null)
                    if (cropType === 'logo') {
                      setSelectedLogo(null)
                    } else {
                      setSelectedBanner(null)
                    }
                  }}
                >
                  Annuler
                </button>
                <button 
                  className={styles.cropBtn}
                  onClick={handleCropComplete}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
