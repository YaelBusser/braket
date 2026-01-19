'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNotification } from '../../../../components/providers/notification-provider'
import ClientPageWrapper from '../../../../components/ClientPageWrapper'
import Link from 'next/link'
import Cropper from 'react-easy-crop'
import styles from './page.module.scss'
import { getCroppedImg } from '@/lib/image'
import VisualsIcon from '../../../../components/icons/VisualsIcon'
import SettingsIcon from '../../../../components/icons/SettingsIcon'

interface Team {
  id: string
  name: string
  avatarUrl: string | null
  bannerUrl: string | null
  description: string | null
  tournamentId: string | null
  tournament: {
    id: string
    name: string
    game: string
  } | null
  tournaments?: Array<{
    id: string
    name: string
    game: string
    status: string
    startDate: string | null
    endDate: string | null
    logoUrl: string | null
    posterUrl: string | null
  }>
  members: Array<{
    id: string
    user: {
      id: string
      pseudo: string
      avatarUrl: string | null
    }
    isCaptain: boolean
    createdAt: string
  }>
  createdAt: string
}

export default function TeamManagePage() {
  return <TeamManageContent />
}

function TeamManageContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const { notify } = useNotification()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'visuals' | 'settings'>('overview')
  const [isCaptain, setIsCaptain] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [showTransferCaptainModal, setShowTransferCaptainModal] = useState(false)
  const [showLeaveTeamModal, setShowLeaveTeamModal] = useState(false)
  
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
  
  // États pour les membres
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState<any[]>([])
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])

  useEffect(() => {
    if (id && session?.user) {
      loadTeam()
    }
  }, [id, session])

  // Vérifier si on arrive depuis une notification avec une demande
  useEffect(() => {
    if (typeof window !== 'undefined' && team && pendingRequests.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const fromNotification = urlParams.get('fromNotification')
      if (fromNotification === 'true') {
        setActiveSection('members')
        // Nettoyer l'URL
        window.history.replaceState({}, '', `/teams/${id}/manage`)
      }
    }
  }, [team, pendingRequests, id])

  // Nettoyage des URLs lors du démontage
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl)
      }
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
    }
  }, [logoPreviewUrl, bannerPreviewUrl, originalImageUrl])

  const loadTeam = async () => {
    if (!session?.user) return
    
    setLoading(true)
    try {
      const teamRes = await fetch(`/api/teams/team/${id}`)
      
      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeam(data)
        const userId = (session.user as any)?.id
        if (!userId) {
          setIsMember(false)
          setIsCaptain(false)
          setLoading(false)
          return
        }
        const userIsMember = data.members.some((m: any) => m.user.id === userId)
        setIsMember(userIsMember)
        const captainMember = data.members.find((m: any) => m.isCaptain)
        const userIsCaptain = captainMember?.user.id === userId
        setIsCaptain(userIsCaptain)
        
        // Debug
        console.log('Team manage - userId:', userId)
        console.log('Team manage - userIsMember:', userIsMember)
        console.log('Team manage - userIsCaptain:', userIsCaptain)
        console.log('Team manage - members:', data.members.map((m: any) => ({ userId: m.user.id, isCaptain: m.isCaptain })))
        setTeamName(data.name || '')
        setTeamDescription(data.description || '')

        // Charger les invitations si l'utilisateur est capitaine
        if (userIsCaptain) {
          try {
            const invitationsRes = await fetch(`/api/teams/invitations?teamId=${id}&status=PENDING`)
            if (invitationsRes.ok) {
              const invitationsData = await invitationsRes.json()
              const allInvitations = invitationsData.invitations || []
              // Séparer les invitations (envoyées par le capitaine) des demandes (faites par les utilisateurs)
              const invitations = allInvitations.filter((inv: any) => inv.userId !== inv.invitedById)
              const requests = allInvitations.filter((inv: any) => inv.userId === inv.invitedById)
              setPendingInvitations(invitations)
              setPendingRequests(requests)
            }
          } catch (error) {
            console.error('Error loading invitations:', error)
          }
        }
      } else {
        notify({ type: 'error', message: 'Équipe introuvable' })
        router.push('/teams')
      }
    } catch (error) {
      console.error('Error loading team:', error)
      notify({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) return
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Invitation annulée' })
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de l\'annulation' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de l\'annulation' })
    }
  }

  const handleAcceptRequest = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}/captain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Demande acceptée' })
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de l\'acceptation' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de l\'acceptation' })
    }
  }

  const handleRejectRequest = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) return
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}/captain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Demande refusée' })
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors du refus' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors du refus' })
    }
  }

  // Recherche d'utilisateurs pour invitation
  useEffect(() => {
    if (!inviteSearch || inviteSearch.length < 2) {
      setInviteResults([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(inviteSearch)}`)
        const data = await res.json()
        if (res.ok) {
          const memberIds = team?.members.map((m: any) => m.user.id) || []
          setInviteResults(data.users.filter((u: any) => !memberIds.includes(u.id)))
        }
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [inviteSearch, team])

  const handleInviteUser = async (invitedUserId: string) => {
    try {
      const res = await fetch(`/api/teams/team/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedUserId })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Invitation envoyée ! L\'utilisateur doit accepter l\'invitation pour rejoindre l\'équipe.' })
        setInviteSearch('')
        setInviteResults([])
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de l\'invitation' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de l\'invitation' })
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return
    try {
      const res = await fetch(`/api/teams/team/${id}/members?userId=${memberUserId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Membre retiré de l\'équipe' })
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors du retrait' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors du retrait' })
    }
  }

  const handleLeaveTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${id}/join`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (res.ok) {
        notify({ type: 'success', message: data.message || 'Vous avez quitté l\'équipe' })
        setShowLeaveTeamModal(false)
        if (data.teamDeleted) {
          router.push('/teams')
        } else {
          router.push('/teams')
        }
      } else {
        if (data.requiresTransfer) {
          // Si le capitaine doit transférer le rôle, ouvrir le modal de transfert
          setShowLeaveTeamModal(false)
          setShowTransferCaptainModal(true)
        } else {
          notify({ type: 'error', message: data.message || 'Erreur lors de la sortie' })
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors de la sortie' })
    }
  }

  const handleTransferCaptain = async (newCaptainUserId: string) => {
    try {
      const res = await fetch(`/api/teams/team/${id}/captain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCaptainUserId })
      })
      const data = await res.json()

      if (res.ok) {
        notify({ type: 'success', message: 'Rôle de capitaine transféré avec succès' })
        setShowTransferCaptainModal(false)
        // Après le transfert, permettre de quitter
        handleLeaveTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors du transfert' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors du transfert' })
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`/api/teams/team/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Équipe supprimée' })
        router.push('/teams')
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de la suppression' })
    }
  }

  const handleSaveSettings = async () => {
    try {
      const formData = new FormData()
      formData.append('name', teamName)
      if (teamDescription) formData.append('description', teamDescription)

      const res = await fetch(`/api/teams/team/${id}`, {
        method: 'PUT',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: 'Paramètres mis à jour !' })
        loadTeam()
      } else {
        notify({ type: 'error', message: data.message || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const onCropComplete = (croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
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

  const handleSaveAvatar = async () => {
    if (!logoPreviewUrl) return

    setIsLoadingVisuals(true)
    try {
      const formData = new FormData()
      const response = await fetch(logoPreviewUrl)
      const blob = await response.blob()
      formData.append('avatar', blob, 'avatar.jpg')
      if (team?.name) formData.append('name', team.name)

      const res = await fetch(`/api/teams/team/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        notify({ type: 'success', message: 'Avatar mis à jour avec succès ! 🎉' })
        // Nettoyer les URLs
        URL.revokeObjectURL(logoPreviewUrl)
        if (originalImageUrl && cropType === 'logo') {
          URL.revokeObjectURL(originalImageUrl)
        }
        setLogoPreviewUrl(null)
        setSelectedLogo(null)
        setOriginalImageUrl(null)
        loadTeam()
      } else {
        let errorMessage = 'Erreur lors de la mise à jour de l\'avatar'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          console.error('Erreur JSON:', jsonError)
        }
        notify({ type: 'error', message: errorMessage })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors de la mise à jour de l\'avatar' })
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
      formData.append('banner', blob, 'banner.jpg')
      if (team?.name) formData.append('name', team.name)

      const res = await fetch(`/api/teams/team/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        notify({ type: 'success', message: 'Bannière mise à jour avec succès ! 🎉' })
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
        loadTeam()
      } else {
        let errorMessage = 'Erreur lors de la mise à jour de la bannière'
        try {
          const error = await res.json()
          errorMessage = error.message || errorMessage
        } catch (jsonError) {
          console.error('Erreur JSON:', jsonError)
        }
        notify({ type: 'error', message: errorMessage })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ type: 'error', message: 'Erreur lors de la mise à jour de la bannière' })
    } finally {
      setIsLoadingVisuals(false)
    }
  }

  if (loading || !session) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className={styles.error}>
        <h2>Équipe introuvable</h2>
        <button onClick={() => router.push('/teams')}>Retour aux équipes</button>
      </div>
    )
  }

  if (!isMember && session?.user) {
    return (
      <div className={styles.error}>
        <h2>Accès refusé</h2>
        <p>Vous devez être membre de cette équipe pour y accéder.</p>
        <button onClick={() => router.push(`/teams/${id}`)}>Voir l'équipe</button>
      </div>
    )
  }

  // Note: On ne peut plus déterminer un seul jeu pour l'équipe car elle peut participer à plusieurs tournois

  return (
    <ClientPageWrapper>
      <div className={styles.adminPage}>
        <div className={styles.adminLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              {team.avatarUrl ? (
                <div className={styles.sidebarLogo}>
                  <img src={team.avatarUrl} alt={team.name} />
                </div>
              ) : (
                <div className={styles.sidebarLogoPlaceholder}>
                  👥
                </div>
              )}
              <div className={styles.sidebarTeamInfo}>
                <div className={styles.sidebarTeamName}>
                  {team.name}
                </div>
                <button 
                  className={styles.viewTeamLink}
                  onClick={() => router.push(`/teams/${id}`)}
                >
                  ← Voir l'équipe
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
                  className={`${styles.navItem} ${activeSection === 'members' ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection('members')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Membres</span>
                </button>
              </div>
              
              {isCaptain && (
                <>
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
                      className={`${styles.navItem} ${activeSection === 'settings' ? styles.navItemActive : ''}`}
                      onClick={() => setActiveSection('settings')}
                    >
                      <SettingsIcon width={20} height={20} />
                      <span>Paramètres</span>
                    </button>
                  </div>
                </>
              )}
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
                    <div className={styles.statValue}>{team.members.length}</div>
                    <div className={styles.statLabel}>Membres</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: 'var(--lt-success)' }}>
                      {team.tournaments?.length || 0}
                    </div>
                    <div className={styles.statLabel}>Tournoi{team.tournaments && team.tournaments.length > 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Info Cards */}
                <h2 className={styles.contentTitle} style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
                  Informations de l'équipe
                </h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <h3 className={styles.infoCardTitle}>Détails</h3>
                    <div className={styles.infoCardContent}>
                      <div><strong>Nom:</strong> {team.name}</div>
                      <div><strong>Tournois:</strong> {team.tournaments?.length || 0} participation{team.tournaments && team.tournaments.length > 1 ? 's' : ''}</div>
                      <div><strong>Créée le:</strong> {new Date(team.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  {team.description && (
                    <div className={styles.infoCard}>
                      <h3 className={styles.infoCardTitle}>Description</h3>
                      <div className={styles.infoCardContent}>
                        <p>{team.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton Quitter l'équipe pour les non-capitaines */}
                {isMember && !isCaptain && (
                  <div className={styles.section} style={{ marginTop: '2rem' }}>
                    <h3 className={styles.sectionTitle}>Actions</h3>
                    <button 
                      className={`${styles.actionButton} ${styles.danger}`} 
                      onClick={() => setShowLeaveTeamModal(true)}
                    >
                      Quitter l'équipe
                    </button>
                  </div>
                )}

              </div>
            )}

            {activeSection === 'members' && (
              <div className={styles.contentSection}>
                <h1 className={styles.contentTitle}>
                  Membres ({team.members.length})
                </h1>
                
                {isCaptain && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Inviter un joueur</h3>
                    <div className={styles.searchWrapper}>
                      <input
                        type="text"
                        value={inviteSearch}
                        onChange={(e) => setInviteSearch(e.target.value)}
                        placeholder="Rechercher un joueur..."
                        className={styles.searchInput}
                      />
                      {inviteResults.length > 0 && (
                        <div className={styles.searchResults}>
                          {inviteResults.map((user: any) => (
                            <div
                              key={user.id}
                              onClick={() => handleInviteUser(user.id)}
                              className={styles.searchResultItem}
                            >
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.pseudo} className={styles.userAvatar} />
                              ) : (
                                <div className={styles.userAvatarPlaceholder}>
                                  {user.pseudo.charAt(0)}
                                </div>
                              )}
                              <span>{user.pseudo}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.membersList}>
                  {team.members.map((member) => (
                    <div key={member.id} className={styles.memberCard}>
                      <div className={styles.memberInfo}>
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt={member.user.pseudo} className={styles.memberAvatar} />
                        ) : (
                          <div className={styles.memberAvatarPlaceholder}>
                            {member.user.pseudo.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className={styles.memberName}>
                            {member.user.pseudo}
                            {member.isCaptain && <span className={styles.captainBadge}>Capitaine</span>}
                          </div>
                          <div className={styles.memberDate}>
                            Membre depuis {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      {isCaptain && member.user.id !== (session?.user as any)?.id && !member.isCaptain && (
                        <div className={styles.memberActions}>
                          <button 
                            className={`${styles.actionButton} ${styles.danger}`}
                            onClick={() => handleRemoveMember(member.user.id)}
                          >
                            Retirer
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.secondary}`}
                            onClick={() => handleTransferCaptain(member.user.id)}
                          >
                            Transférer capitaine
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isCaptain && pendingInvitations.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ 
                      color: '#fff', 
                      marginBottom: '0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      opacity: 0.7
                    }}>
                      Invitations en attente ({pendingInvitations.length})
                    </h4>
                    <div className={styles.membersList}>
                      {pendingInvitations.map((invitation: any) => (
                        <div key={invitation.id} className={styles.memberCard} style={{
                          borderColor: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.05)'
                        }}>
                          <div className={styles.memberInfo}>
                            {invitation.user.avatarUrl ? (
                              <img src={invitation.user.avatarUrl} alt={invitation.user.pseudo} className={styles.memberAvatar} />
                            ) : (
                              <div className={styles.memberAvatarPlaceholder}>
                                {invitation.user.pseudo.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className={styles.memberName} style={{ fontSize: '0.875rem' }}>
                                {invitation.user.pseudo}
                                <span style={{
                                  background: '#f59e0b',
                                  color: '#fff',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
                                  fontWeight: '500',
                                  marginLeft: '0.5rem'
                                }}>
                                  En attente
                                </span>
                              </div>
                              <div className={styles.memberDate} style={{ fontSize: '0.75rem' }}>
                                Invité le {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              padding: '0.375rem 0.75rem',
                              color: '#9ca3af',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#ef4444'
                              e.currentTarget.style.color = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#374151'
                              e.currentTarget.style.color = '#9ca3af'
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isCaptain && pendingRequests.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ 
                      color: '#fff', 
                      marginBottom: '0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      opacity: 0.7
                    }}>
                      Demandes en attente ({pendingRequests.length})
                    </h4>
                    <div className={styles.membersList}>
                      {pendingRequests.map((request: any) => (
                        <div key={request.id} className={styles.memberCard} style={{
                          borderColor: '#3b82f6',
                          background: 'rgba(59, 130, 246, 0.05)'
                        }}>
                          <div className={styles.memberInfo}>
                            {request.user.avatarUrl ? (
                              <img src={request.user.avatarUrl} alt={request.user.pseudo} className={styles.memberAvatar} />
                            ) : (
                              <div className={styles.memberAvatarPlaceholder}>
                                {request.user.pseudo.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className={styles.memberName} style={{ fontSize: '0.875rem' }}>
                                {request.user.pseudo}
                                <span style={{
                                  background: '#3b82f6',
                                  color: '#fff',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
                                  fontWeight: '500',
                                  marginLeft: '0.5rem'
                                }}>
                                  Demande
                                </span>
                              </div>
                              <div className={styles.memberDate} style={{ fontSize: '0.75rem' }}>
                                Demande le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className={`${styles.actionButton} ${styles.secondary}`}
                              style={{
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              Refuser
                            </button>
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className={`${styles.actionButton} ${styles.success}`}
                              style={{
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              Accepter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'visuals' && isCaptain && (
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
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerPreviewUrl || team?.bannerUrl || '/images/games.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <div className={styles.visualsBannerOverlay}>
                        <button 
                          className={styles.visualsBannerButton}
                          onClick={() => document.getElementById('banner-input-team')?.click()}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                          Modifier la bannière
                        </button>
                      </div>
                      <input
                        id="banner-input-team"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                    
                    <div className={styles.visualsAvatarWrapper}>
                      <div className={styles.visualsAvatarContainer}>
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Avatar preview" className={styles.visualsAvatar} />
                        ) : team?.avatarUrl ? (
                          <img src={team.avatarUrl} alt="Avatar actuel" className={styles.visualsAvatar} />
                        ) : (
                          <div className={styles.visualsAvatarPlaceholder}>
                            👥
                          </div>
                        )}
                        <button 
                          className={styles.visualsAvatarButton}
                          onClick={() => document.getElementById('avatar-input-team')?.click()}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </button>
                        <input
                          id="avatar-input-team"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
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
                          <span className={styles.visualsActionLabel}>Photo modifiée</span>
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
                            onClick={handleSaveAvatar}
                            disabled={isLoadingVisuals}
                          >
                            {isLoadingVisuals ? 'Sauvegarde...' : 'Sauvegarder la photo'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal de crop */}
            {showCropper && originalImageUrl && (
              <div className={styles.cropModal}>
                <div className={styles.cropContainer}>
                  <h2 className={styles.cropTitle}>
                    {cropType === 'logo' ? 'Recadrer la photo de profil' : 'Recadrer la bannière'}
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

            {activeSection === 'settings' && (
              <div className={styles.contentSection}>
                <h1 className={styles.contentTitle}>Paramètres</h1>
                
                {isCaptain && (
                  <>
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Informations générales</h3>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nom de l'équipe</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className={styles.formInput}
                          placeholder="Nom de l'équipe"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea
                          value={teamDescription}
                          onChange={(e) => setTeamDescription(e.target.value)}
                          className={styles.formTextarea}
                          placeholder="Description de l'équipe"
                          rows={4}
                        />
                      </div>
                      <button className={`${styles.actionButton} ${styles.primary}`} onClick={handleSaveSettings}>
                        Sauvegarder
                      </button>
                    </div>

                    <div className={styles.dangerZone}>
                      <h3 className={styles.sectionTitle}>Zone de danger</h3>
                      <p>La suppression de l'équipe est définitive. Tous les membres seront retirés.</p>
                      <button className={`${styles.actionButton} ${styles.danger}`} onClick={handleDeleteTeam}>
                        Supprimer l'équipe
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Modal de confirmation pour quitter l'équipe */}
        {showLeaveTeamModal && (
          <div className={styles.modalOverlay} onClick={() => setShowLeaveTeamModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{isCaptain ? 'Quitter l\'équipe' : 'Confirmer la sortie'}</h2>
                <button className={styles.modalClose} onClick={() => setShowLeaveTeamModal(false)}>
                  ×
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <p>
                  {isCaptain 
                    ? 'En tant que capitaine, vous devez transférer votre rôle à un autre membre avant de quitter l\'équipe.'
                    : 'Êtes-vous sûr de vouloir quitter cette équipe ?'
                  }
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={`${styles.modalButton} ${styles.modalButtonReject}`}
                  onClick={() => setShowLeaveTeamModal(false)}
                >
                  Annuler
                </button>
                {isCaptain ? (
                  <button
                    className={`${styles.modalButton} ${styles.modalButtonAccept}`}
                    onClick={() => {
                      setShowLeaveTeamModal(false)
                      setShowTransferCaptainModal(true)
                    }}
                  >
                    Transférer le rôle
                  </button>
                ) : (
                  <button
                    className={`${styles.modalButton} ${styles.modalButtonDanger}`}
                    onClick={handleLeaveTeam}
                  >
                    Quitter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour transférer le rôle de capitaine */}
        {showTransferCaptainModal && team && (
          <div 
            className={styles.modalOverlay}
            onClick={() => setShowTransferCaptainModal(false)}
          >
            <div 
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Transférer le rôle de capitaine</h2>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowTransferCaptainModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <p>
                  Sélectionnez un membre à qui transférer le rôle de capitaine avant de quitter l'équipe.
                </p>
                
                {team.members.filter((m: any) => {
                  const userId = (session?.user as any)?.id
                  return m.user.id !== userId && !m.isCaptain
                }).length === 0 ? (
                  <p className={styles.modalErrorMessage}>
                    Aucun autre membre disponible pour transférer le rôle.
                  </p>
                ) : (
                  <div className={styles.modalMemberList}>
                    {team.members
                      .filter((m: any) => {
                        const userId = (session?.user as any)?.id
                        return m.user.id !== userId && !m.isCaptain
                      })
                      .map((member: any) => (
                        <button
                          key={member.id}
                          className={styles.modalMemberButton}
                          onClick={() => handleTransferCaptain(member.user.id)}
                        >
                          {member.user.avatarUrl ? (
                            <img 
                              src={member.user.avatarUrl} 
                              alt={member.user.pseudo}
                              className={styles.modalMemberAvatar}
                            />
                          ) : (
                            <div className={styles.modalMemberAvatarPlaceholder}>
                              {member.user.pseudo?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={styles.modalMemberName}>
                            {member.user.pseudo}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={`${styles.modalButton} ${styles.modalButtonReject}`}
                  onClick={() => setShowTransferCaptainModal(false)}
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
