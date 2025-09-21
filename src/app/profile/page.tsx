'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import { useNotification } from '../../components/providers/notification-provider'
import styles from './page.module.scss'
import { getCroppedImg } from '../../lib/image'

function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  
  // États pour la gestion du profil
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    pseudo: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // États pour la vérification du pseudo
  const [pseudoStatus, setPseudoStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [pseudoError, setPseudoError] = useState<string | null>(null)
  
  // États pour l'avatar
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  
  // États pour les données utilisateur
  const [userTournaments, setUserTournaments] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  
  // Navigation par onglets
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'teams' | 'registrations' | 'settings'>('overview')
  
  // Statistiques utilisateur
  const [userStats, setUserStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalParticipants: 0,
    totalWins: 0,
    totalTeams: 0,
    totalRegistrations: 0
  })

  // Update formData when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData({
        pseudo: session.user.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [session])

  // Redirection hors rendu pour éviter les problèmes d'ordre des hooks
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
  }, [status, router])

  // Charger les données utilisateur
  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
    }
  }, [avatarPreviewUrl, originalImageUrl])

  const loadUserData = async () => {
    setLoadingData(true)
    try {
      // Charger les tournois de l'utilisateur
      const tournamentsRes = await fetch('/api/tournaments?mine=true')
      if (tournamentsRes.ok) {
        const tournaments = await tournamentsRes.json()
        setUserTournaments(tournaments)
      }

      // Charger les statistiques
      const statsRes = await fetch('/api/profile/stats')
      if (statsRes.ok) {
        const stats = await statsRes.json()
        setUserStats(stats)
      }

      // TODO: Charger les équipes et inscriptions
      // const teamsRes = await fetch('/api/teams?mine=true')
      // const registrationsRes = await fetch('/api/registrations?mine=true')
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Fonction pour vérifier la disponibilité du pseudo
  const checkPseudoAvailability = async (pseudo: string) => {
    if (!pseudo || pseudo.length < 2) {
      setPseudoStatus('idle')
      setPseudoError(null)
      return
    }

    // Si c'est le même pseudo que l'utilisateur actuel, pas besoin de vérifier
    if (pseudo === session?.user?.name) {
      setPseudoStatus('available')
      setPseudoError(null)
      return
    }

    setPseudoStatus('checking')
    setPseudoError(null)

    try {
      const res = await fetch(`/api/profile/check-pseudo?pseudo=${encodeURIComponent(pseudo)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.available) {
          setPseudoStatus('available')
          setPseudoError(null)
        } else {
          setPseudoStatus('taken')
          setPseudoError('Ce pseudo est déjà utilisé')
        }
      } else {
        setPseudoStatus('idle')
        setPseudoError('Erreur lors de la vérification')
      }
    } catch (error) {
      setPseudoStatus('idle')
      setPseudoError('Erreur lors de la vérification')
    }
  }

  // Debounced check du pseudo
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isEditing && formData.pseudo) {
        checkPseudoAvailability(formData.pseudo)
      }
    }, 500) // Attendre 500ms après la dernière frappe

    return () => clearTimeout(timeoutId)
  }, [formData.pseudo, isEditing, session?.user?.name])

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAvatar(file)
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)
      setShowCropper(true)
    }
  }

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || !originalImageUrl) return

    try {
      const croppedImageBlob = await getCroppedImg(originalImageUrl, croppedAreaPixels)
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
      setAvatarPreviewUrl(croppedImageUrl)
      setShowCropper(false)
    } catch (error) {
      console.error('Erreur lors du crop:', error)
      notify({ message: 'Erreur lors du traitement de l\'image', type: 'error' })
    }
  }

  const handleSaveAvatar = async () => {
    if (!avatarPreviewUrl) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      const response = await fetch(avatarPreviewUrl)
      const blob = await response.blob()
      formData.append('avatar', blob, 'avatar.jpg')

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        // Mettre à jour la session avec la nouvelle URL d'avatar
        await update({
          name: session?.user?.name,
          image: result.user?.avatarUrl || result.avatarUrl
        })
        notify({ message: 'Avatar mis à jour avec succès ! 🎉', type: 'success' })
        // Nettoyer les URLs
        URL.revokeObjectURL(avatarPreviewUrl)
        if (originalImageUrl) {
          URL.revokeObjectURL(originalImageUrl)
        }
        setAvatarPreviewUrl(null)
        setSelectedAvatar(null)
        setOriginalImageUrl(null)
      } else {
        let errorMessage = 'Erreur lors de la mise à jour de l\'avatar'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          // Si le JSON n'est pas valide, on utilise le message par défaut
          console.error('Erreur JSON:', jsonError)
        }
        notify({ message: errorMessage, type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors de la mise à jour de l\'avatar', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    // Vérifier que le pseudo est disponible avant de sauvegarder
    if (pseudoStatus === 'taken') {
      notify({ message: 'Ce pseudo est déjà utilisé', type: 'error' })
      return
    }

    if (pseudoStatus === 'checking') {
      notify({ message: 'Vérification du pseudo en cours...', type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pseudo: formData.pseudo
        })
      })

      if (res.ok) {
        const result = await res.json()
        // Mettre à jour la session avec le nouveau pseudo
        await update({
          name: formData.pseudo,
          image: session?.user?.image
        })
        notify({ message: 'Profil mis à jour avec succès ! ✨', type: 'success' })
        setIsEditing(false)
      } else {
        let errorMessage = 'Erreur lors de la mise à jour du profil'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          // Si le JSON n'est pas valide, on utilise le message par défaut
          console.error('Erreur JSON:', jsonError)
        }
        notify({ message: errorMessage, type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors de la mise à jour du profil', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      notify({ message: 'Les mots de passe ne correspondent pas', type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      if (res.ok) {
        notify({ message: 'Mot de passe mis à jour avec succès ! 🔐', type: 'success' })
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        let errorMessage = 'Erreur lors de la mise à jour du mot de passe'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          // Si le JSON n'est pas valide, on utilise le message par défaut
          console.error('Erreur JSON:', jsonError)
        }
        notify({ message: errorMessage, type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors de la mise à jour du mot de passe', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <ClientPageWrapper>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </ClientPageWrapper>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <ClientPageWrapper>
      <div className={styles.profilePage}>
        {/* Banner avec avatar et titre */}
        <div className={styles.profileBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <h1 className={styles.profileTitle}>
                {session?.user?.name || 'Utilisateur'}
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className={styles.tabNavigation}>
          <div className={styles.tabContainer}>
            {[
              { key: 'overview', label: 'Vue d\'ensemble' },
              { key: 'tournaments', label: 'Tournois' },
              { key: 'teams', label: 'Équipes' },
              { key: 'registrations', label: 'Inscriptions' },
              { key: 'settings', label: 'Paramètres' }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Tournois créés</h3>
                  <div className={styles.statNumber}>{userStats.totalTournaments}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Tournois actifs</h3>
                  <div className={styles.statNumber}>{userStats.activeTournaments}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Victoires</h3>
                  <div className={styles.statNumber}>{userStats.totalWins}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Équipes</h3>
                  <div className={styles.statNumber}>{userStats.totalTeams}</div>
                </div>
              </div>
              
              <div className={styles.recentActivity}>
                <h3>Activité récente</h3>
                <div className={styles.activityList}>
                  {userTournaments && Array.isArray(userTournaments) ? userTournaments.slice(0, 3).map((tournament) => (
                    <div key={tournament.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>🏆</div>
                      <div className={styles.activityContent}>
                        <h4>{tournament.name}</h4>
                        <p>{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )) : (
                    <div className={styles.emptyActivity}>
                      <p>Aucune activité récente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className={styles.tournamentsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes tournois</h3>
                <button 
                  className={styles.createBtn}
                  onClick={() => router.push('/tournaments/create')}
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
                      onClick={() => router.push('/tournaments/create')}
                    >
                      Créer mon premier tournoi
                    </button>
                  </div>
                ) : (
                  userTournaments.map((tournament) => (
                    <div key={tournament.id} className={styles.tournamentCard}>
                      <div className={styles.tournamentIcon}>🏆</div>
                      <div className={styles.tournamentInfo}>
                        <h4>{tournament.name}</h4>
                        <p>{tournament.game || 'Jeu non spécifié'}</p>
                        <p className={styles.tournamentDate}>
                          {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={styles.tournamentStatus}>
                        <span className={`${styles.status} ${styles[tournament.status?.toLowerCase()]}`}>
                          {tournament.status === 'REG_OPEN' ? 'Inscriptions ouvertes' :
                           tournament.status === 'IN_PROGRESS' ? 'En cours' :
                           tournament.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                        </span>
                        <p>{tournament._count?.registrations || 0} participants</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className={styles.teamsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes équipes</h3>
                <button className={styles.createBtn}>
                  Créer une équipe
                </button>
              </div>
              
              <div className={styles.emptyState}>
                <p>Aucune équipe rejointe</p>
              </div>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className={styles.registrationsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes inscriptions</h3>
              </div>
              
              <div className={styles.emptyState}>
                <p>Aucune inscription</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.settingsTab}>
              <div className={styles.settingsGrid}>
                <div className={styles.settingsColumn}>
                  <div className={styles.settingsSection}>
                    <h3>Informations personnelles</h3>
                    <div className={styles.formGroup}>
                      <label>Pseudo</label>
                      <div className={styles.inputContainer}>
                        <input
                          type="text"
                          value={formData.pseudo}
                          onChange={(e) => setFormData(prev => ({ ...prev, pseudo: e.target.value }))}
                          disabled={!isEditing}
                          className={`${styles.formInput} ${pseudoStatus === 'taken' ? styles.inputError : ''} ${pseudoStatus === 'available' ? styles.inputSuccess : ''}`}
                        />
                        {isEditing && formData.pseudo && (
                          <div className={styles.pseudoStatus}>
                            {pseudoStatus === 'checking' && (
                              <div className={styles.statusChecking}>
                                <div className={styles.spinner}></div>
                                <span>Vérification...</span>
                              </div>
                            )}
                            {pseudoStatus === 'available' && (
                              <div className={styles.statusAvailable}>
                                ✓ Disponible
                              </div>
                            )}
                            {pseudoStatus === 'taken' && (
                              <div className={styles.statusTaken}>
                                ✗ Déjà utilisé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {pseudoError && (
                        <div className={styles.errorMessage}>
                          {pseudoError}
                        </div>
                      )}
                    </div>
                    <div className={styles.formActions}>
                      {isEditing ? (
                        <>
                          <button 
                            className={styles.saveBtn}
                            onClick={handleSaveProfile}
                            disabled={isLoading || pseudoStatus === 'taken' || pseudoStatus === 'checking'}
                          >
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                          </button>
                          <button 
                            className={styles.cancelBtn}
                            onClick={() => setIsEditing(false)}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button 
                          className={styles.editBtn}
                          onClick={() => setIsEditing(true)}
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.settingsSection}>
                    <h3>Photo de profil</h3>
                    <div className={styles.avatarSettings}>
                      <div className={styles.currentAvatar}>
                        {avatarPreviewUrl ? (
                          <img src={avatarPreviewUrl} alt="Avatar preview" className={styles.avatarPreview} />
                        ) : session?.user?.image ? (
                          <img src={session.user.image} alt="Avatar actuel" className={styles.avatarPreview} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {session?.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className={styles.avatarActions}>
                        <button 
                          className={styles.uploadBtn}
                          onClick={() => document.getElementById('avatar-input-settings')?.click()}
                        >
                          Changer la photo
                        </button>
                        <input
                          id="avatar-input-settings"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                        {avatarPreviewUrl && (
                          <div className={styles.avatarPreviewActions}>
                            <button 
                              className={styles.saveBtn}
                              onClick={handleSaveAvatar}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        <button 
                          className={styles.cancelBtn}
                          onClick={() => {
                            // Nettoyer les URLs
                            if (avatarPreviewUrl) {
                              URL.revokeObjectURL(avatarPreviewUrl)
                            }
                            if (originalImageUrl) {
                              URL.revokeObjectURL(originalImageUrl)
                            }
                            setAvatarPreviewUrl(null)
                            setSelectedAvatar(null)
                            setOriginalImageUrl(null)
                          }}
                        >
                          Annuler
                        </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingsColumn}>
                  <div className={styles.settingsSection}>
                    <h3>Changer le mot de passe</h3>
                    <div className={styles.formGroup}>
                      <label>Mot de passe actuel</label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={styles.formInput}
                      />
                    </div>
                    <button 
                      className={styles.saveBtn}
                      onClick={handlePasswordChange}
                      disabled={isLoading || !formData.currentPassword || !formData.newPassword}
                    >
                      {isLoading ? 'Changement...' : 'Changer le mot de passe'}
                    </button>
                  </div>

                  <div className={styles.settingsSection}>
                    <h3>Compte</h3>
                    <button 
                      className={styles.logoutBtn}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de crop d'avatar */}
        {showCropper && originalImageUrl && (
          <div className={styles.cropModal}>
            <div className={styles.cropContainer}>
              <div className={styles.cropArea}>
                <Cropper
                  image={originalImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className={styles.cropControls}>
                <button 
                  className={styles.cropBtn}
                  onClick={handleCropComplete}
                >
                  Valider le crop
                </button>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowCropper(false)
                    setOriginalImageUrl(null)
                    setSelectedAvatar(null)
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientPageWrapper>
  )
}

export default function Profile() {
  return (
    <ClientPageWrapper>
      <ProfilePage />
    </ClientPageWrapper>
  )
}