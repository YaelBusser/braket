'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import SettingsIcon from '../../components/icons/SettingsIcon'
import VisualsIcon from '../../components/icons/VisualsIcon'
import styles from './page.module.scss'
import { getCroppedImg } from '../../lib/image'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  
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
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  
  // États pour la bannière - initialiser avec la valeur par défaut
  const [bannerUrl, setBannerUrl] = useState<string>('/images/games.jpg')
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<File | null>(null)

  const [activeSection, setActiveSection] = useState<'account' | 'visuals' | 'password' | 'data'>('account')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

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

  // Charger les données du profil (bannière) - en priorité pour un affichage immédiat
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.user?.bannerUrl) {
            setBannerUrl(data.user.bannerUrl)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
      }
    }
    if (session?.user) {
      loadProfile()
    }
  }, [session])

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', '/settings') } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
  }, [status, router, openAuthModal])

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl)
      }
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
    }
  }, [avatarPreviewUrl, bannerPreviewUrl, originalImageUrl])

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
      setCropType('avatar')
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
      
      if (cropType === 'avatar') {
        setAvatarPreviewUrl(croppedImageUrl)
      } else {
        setBannerPreviewUrl(croppedImageUrl)
      }
      
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

  const handleSaveBanner = async () => {
    if (!bannerPreviewUrl) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      const response = await fetch(bannerPreviewUrl)
      const blob = await response.blob()
      formData.append('banner', blob, 'banner.jpg')

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        setBannerUrl(result.user?.bannerUrl || null)
        notify({ message: 'Bannière mise à jour avec succès ! 🎉', type: 'success' })
        // Nettoyer les URLs
        if (bannerPreviewUrl) {
          URL.revokeObjectURL(bannerPreviewUrl)
        }
        if (originalImageUrl && cropType === 'banner') {
          URL.revokeObjectURL(originalImageUrl)
        }
        setBannerPreviewUrl(null)
        setSelectedBanner(null)
        setOriginalImageUrl(null)
      } else {
        let errorMessage = 'Erreur lors de la mise à jour de la bannière'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          console.error('Erreur JSON:', jsonError)
        }
        notify({ message: errorMessage, type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors de la mise à jour de la bannière', type: 'error' })
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

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `braket-data-export.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        notify({ message: 'Données exportées avec succès', type: 'success' })
      } else {
        notify({ message: 'Erreur lors de l\'export des données', type: 'error' })
      }
    } catch {
      notify({ message: 'Erreur lors de l\'export des données', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        const data = await res.json()
        notify({ message: data.message || 'Erreur lors de la suppression', type: 'error' })
      }
    } catch {
      notify({ message: 'Erreur lors de la suppression du compte', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className={styles.settingsPage}>
        <div className={styles.settingsLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              {session?.user?.image ? (
                <div className={styles.sidebarAvatar}>
                  <img src={session.user.image} alt="Avatar" />
                </div>
              ) : (
                <div className={styles.sidebarAvatarPlaceholder}>
                  {(session?.user?.name || 'U')?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.sidebarUserInfo}>
                <div className={styles.sidebarUsername}>
                  {session?.user?.name || 'Utilisateur'}
                </div>
                <button 
                  className={styles.viewProfileLink}
                  onClick={() => router.push('/profile')}
                >
                  ← Voir le profil
                </button>
              </div>
            </div>

            <nav className={styles.sidebarNav}>
              <div className={styles.navSection}>
                <button
                  className={`${styles.navItem} ${activeSection === 'account' ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection('account')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Mon compte</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'visuals' ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection('visuals')}
                >
                  <VisualsIcon width={20} height={20} />
                  <span>Visuels</span>
                </button>
              </div>

              <div className={styles.navSection}>
                <div className={styles.navSectionTitle}>CONNEXION ET SÉCURITÉ</div>
                <button
                  className={`${styles.navItem} ${activeSection === 'password' ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection('password')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>Mot de passe</span>
                </button>
              </div>

              <div className={styles.navSection}>
                <div className={styles.navSectionTitle}>CONFIDENTIALITÉ</div>
                <button
                  className={`${styles.navItem} ${activeSection === 'data' ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection('data')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Données personnelles</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {activeSection === 'account' && (
              <div className={styles.contentSection}>
                <h1 className={styles.contentTitle}>Mon compte</h1>
                
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Nom d'utilisateur
                    </label>
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
                          <div className={styles.statusAvailable}>✓ Disponible</div>
                        )}
                        {pseudoStatus === 'taken' && (
                          <div className={styles.statusTaken}>✗ Déjà utilisé</div>
                        )}
                      </div>
                    )}
                    {pseudoError && (
                      <div className={styles.errorMessage}>{pseudoError}</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className={styles.formInput}
                    />
                    <div className={styles.formHint}>
                      Votre compte doit être sécurisé par un mot de passe pour changer l'email. 
                      Allez dans <button className={styles.linkButton} onClick={() => setActiveSection('password')}>Connexion & Sécurité</button> pour définir un mot de passe.
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    {isEditing ? (
                      <>
                        <button 
                          className={styles.cancelButton}
                          onClick={() => setIsEditing(false)}
                        >
                          Annuler
                        </button>
                        <button 
                          className={styles.saveButton}
                          onClick={handleSaveProfile}
                          disabled={isLoading || pseudoStatus === 'taken' || pseudoStatus === 'checking'}
                        >
                          {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </>
                    ) : (
                      <button 
                        className={styles.editButton}
                        onClick={() => setIsEditing(true)}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'visuals' && (
              <div className={styles.contentSection}>
                <div className={styles.profileHeaderSection}>
                  <h1 className={styles.contentTitle}>Visuels</h1>
                </div>
                
                <div className={styles.visualsSection}>
                  {/* Bannière avec avatar par-dessus (comme la page de profil) */}
                  <div className={styles.visualsHeader}>
                    <div 
                      className={styles.visualsBanner}
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerPreviewUrl || bannerUrl || '/images/games.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <div className={styles.visualsBannerOverlay}>
                        <button 
                          className={styles.visualsBannerButton}
                          onClick={() => document.getElementById('banner-input-settings')?.click()}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                          Modifier la bannière
                        </button>
                      </div>
                      <input
                        id="banner-input-settings"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                    
                    <div className={styles.visualsAvatarWrapper}>
                      <div className={styles.visualsAvatarContainer}>
                        {avatarPreviewUrl ? (
                          <img src={avatarPreviewUrl} alt="Avatar preview" className={styles.visualsAvatar} />
                        ) : session?.user?.image ? (
                          <img src={session.user.image} alt="Avatar actuel" className={styles.visualsAvatar} />
                        ) : (
                          <div className={styles.visualsAvatarPlaceholder}>
                            {session?.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <button 
                          className={styles.visualsAvatarButton}
                          onClick={() => document.getElementById('avatar-input-settings')?.click()}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </button>
                        <input
                          id="avatar-input-settings"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {(bannerPreviewUrl || avatarPreviewUrl) && (
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
                            disabled={isLoading}
                          >
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder la bannière'}
                          </button>
                        </div>
                      )}
                      {avatarPreviewUrl && (
                        <div className={styles.visualsActionGroup}>
                          <span className={styles.visualsActionLabel}>Photo modifiée</span>
                          <button 
                            className={styles.cancelButton}
                            onClick={() => {
                              if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
                              if (originalImageUrl && cropType === 'avatar') {
                                URL.revokeObjectURL(originalImageUrl)
                                setOriginalImageUrl(null)
                              }
                              setAvatarPreviewUrl(null)
                              setSelectedAvatar(null)
                            }}
                          >
                            Annuler
                          </button>
                          <button 
                            className={styles.saveButton}
                            onClick={handleSaveAvatar}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Sauvegarde...' : 'Sauvegarder la photo'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'password' && (
              <div className={styles.contentSection}>
                <h1 className={styles.contentTitle}>Mot de passe</h1>
                
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={styles.formInput}
                    />
                  </div>
                  <button 
                    className={styles.saveButton}
                    onClick={handlePasswordChange}
                    disabled={isLoading || !formData.currentPassword || !formData.newPassword}
                  >
                    {isLoading ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className={styles.contentSection}>
                <h1 className={styles.contentTitle}>Données personnelles</h1>
                
                <div className={styles.formSection}>
                  <div className={styles.dataCard}>
                    <div className={styles.dataCardHeader}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <div>
                        <h3>Exporter mes données</h3>
                        <p>Téléchargez une copie de toutes vos données personnelles au format JSON (droit à la portabilité, art. 20 RGPD).</p>
                      </div>
                    </div>
                    <button
                      className={styles.exportButton}
                      onClick={handleExportData}
                      disabled={isExporting}
                    >
                      {isExporting ? 'Export en cours...' : 'Télécharger mes données'}
                    </button>
                  </div>

                  <div className={styles.dataCard}>
                    <div className={styles.dataCardHeader}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <div>
                        <h3>Vos droits</h3>
                        <p>Consultez notre <a href="/privacy" className={styles.linkButton}>Politique de confidentialité</a> pour connaître vos droits en matière de données personnelles. Vous pouvez aussi nous contacter à <a href="mailto:contact@braket-tournament.com" className={styles.linkButton}>contact@braket-tournament.com</a>.</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dangerZone}>
                    <h2 className={styles.dangerTitle}>Zone de danger</h2>
                    <div className={styles.dangerCard}>
                      <div>
                        <h3>Supprimer mon compte</h3>
                        <p>Cette action est irréversible. Toutes vos données, équipes créées, inscriptions aux tournois et messages seront définitivement supprimés.</p>
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Supprimer mon compte
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modal de suppression de compte */}
        {showDeleteModal && (
          <div className={styles.cropModal}>
            <div className={styles.deleteModal}>
              <h2 className={styles.deleteModalTitle}>Supprimer votre compte</h2>
              <p className={styles.deleteModalText}>
                Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées : profil, équipes, inscriptions, messages, notifications.
              </p>
              <p className={styles.deleteModalText}>
                Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={styles.formInput}
                placeholder="Tapez SUPPRIMER"
                autoFocus
              />
              <div className={styles.deleteModalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                >
                  Annuler
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de crop */}
        {showCropper && originalImageUrl && (
          <div className={styles.cropModal}>
            <div className={styles.cropContainer}>
              <h2 className={styles.cropTitle}>
                {cropType === 'avatar' ? 'Recadrer la photo de profil' : 'Recadrer la bannière'}
              </h2>
              <div 
                className={styles.cropArea} 
                data-aspect={cropType === 'banner' ? 'banner' : undefined}
                data-crop-type={cropType}
              >
                <Cropper
                  image={originalImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropType === 'avatar' ? 1 : 16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape={cropType === 'avatar' ? 'round' : 'rect'}
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
                      if (cropType === 'avatar') {
                        setSelectedAvatar(null)
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

