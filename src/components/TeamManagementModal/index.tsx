'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useNotification } from '../providers/notification-provider'
import Button from '../ui/Button'
import styles from './index.module.scss'

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  onUpdate?: () => void
}

export default function TeamManagementModal({ isOpen, onClose, teamId, onUpdate }: TeamManagementModalProps) {
  const { data: session } = useSession()
  const { notify } = useNotification()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState<any[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [isCaptain, setIsCaptain] = useState(false)

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeam()
    }
  }, [isOpen, teamId])

  const loadTeam = async () => {
    try {
      const res = await fetch(`/api/teams/team/${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setTeam(data)
        const userId = (session?.user as any)?.id
        const captainMember = data.members.find((m: any) => m.isCaptain)
        setIsCaptain(captainMember?.user.id === userId)
      }
    } catch (error) {
      console.error('Error loading team:', error)
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
      const res = await fetch(`/api/teams/team/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedUserId })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Invitation envoyée ! L\'utilisateur doit accepter l\'invitation pour rejoindre l\'équipe.', type: 'success' })
        setInviteSearch('')
        setInviteResults([])
        loadTeam()
        if (onUpdate) onUpdate()
      } else {
        notify({ message: data.message || 'Erreur lors de l\'invitation', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de l\'invitation', type: 'error' })
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return
    try {
      const res = await fetch(`/api/teams/team/${teamId}/members?userId=${memberUserId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Membre retiré de l\'équipe', type: 'success' })
        loadTeam()
        if (onUpdate) onUpdate()
      } else {
        notify({ message: data.message || 'Erreur lors du retrait', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors du retrait', type: 'error' })
    }
  }

  const handleTransferCaptain = async (newCaptainUserId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir transférer le rôle de capitaine à ce joueur ?')) return
    try {
      const res = await fetch(`/api/teams/team/${teamId}/captain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCaptainUserId })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Rôle de capitaine transféré avec succès', type: 'success' })
        loadTeam()
        if (onUpdate) onUpdate()
      } else {
        notify({ message: data.message || 'Erreur lors du transfert', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors du transfert', type: 'error' })
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`/api/teams/team/${teamId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Équipe supprimée', type: 'success' })
        onClose()
        if (onUpdate) onUpdate()
        window.location.href = '/teams'
      } else {
        notify({ message: data.message || 'Erreur lors de la suppression', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de la suppression', type: 'error' })
    }
  }

  const handleLeaveTeam = async () => {
    if (!confirm('Êtes-vous sûr de vouloir quitter cette équipe ?')) return
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Vous avez quitté l\'équipe', type: 'success' })
        onClose()
        if (onUpdate) onUpdate()
        window.location.reload()
      } else {
        notify({ message: data.message || 'Erreur lors de la sortie', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de la sortie', type: 'error' })
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!isCaptain) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      if (team?.name) formData.append('name', team.name)

      const res = await fetch(`/api/teams/team/${teamId}`, {
        method: 'PUT',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Avatar mis à jour !', type: 'success' })
        loadTeam()
        if (onUpdate) onUpdate()
      } else {
        notify({ message: data.message || 'Erreur lors de l\'upload', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de l\'upload', type: 'error' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleBannerUpload = async (file: File) => {
    if (!isCaptain) return
    setUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('banner', file)
      if (team?.name) formData.append('name', team.name)

      const res = await fetch(`/api/teams/team/${teamId}`, {
        method: 'PUT',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Bannière mise à jour !', type: 'success' })
        loadTeam()
        if (onUpdate) onUpdate()
      } else {
        notify({ message: data.message || 'Erreur lors de l\'upload', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de l\'upload', type: 'error' })
    } finally {
      setUploadingBanner(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.modalHeader}>
          <h2>Gérer l'équipe</h2>
          <p className={styles.subtitle}>{team?.name}</p>
        </div>

        <div className={styles.modalBody}>
          {!isCaptain && (
            <div className={styles.section}>
              <h3>Actions</h3>
              <Button variant="error" onClick={handleLeaveTeam}>
                Quitter l'équipe
              </Button>
            </div>
          )}

          {isCaptain && (
            <>
              {/* Avatar */}
              <div className={styles.section}>
                <h3>Avatar de l'équipe</h3>
                <div className={styles.avatarSection}>
                  {team?.avatarUrl ? (
                    <img 
                      src={team.avatarUrl} 
                      alt={team.name}
                      className={styles.avatarPreview}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      👥
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleAvatarUpload(file)
                      }}
                      disabled={uploadingAvatar}
                      style={{ display: 'none' }}
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" style={{ cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                      <Button 
                        variant="secondary" 
                        disabled={uploadingAvatar}
                        style={{ pointerEvents: 'none' }}
                      >
                        {uploadingAvatar ? 'Upload...' : 'Changer l\'avatar'}
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bannière */}
              <div className={styles.section}>
                <h3>Bannière de l'équipe</h3>
                <div className={styles.bannerSection}>
                  {team?.bannerUrl ? (
                    <img 
                      src={team.bannerUrl} 
                      alt={team.name}
                      className={styles.bannerPreview}
                    />
                  ) : (
                    <div className={styles.bannerPlaceholder}>
                      <span>Pas de bannière</span>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleBannerUpload(file)
                      }}
                      disabled={uploadingBanner}
                      style={{ display: 'none' }}
                      id="banner-upload"
                    />
                    <label htmlFor="banner-upload" style={{ cursor: uploadingBanner ? 'not-allowed' : 'pointer' }}>
                      <Button 
                        variant="secondary" 
                        disabled={uploadingBanner}
                        style={{ pointerEvents: 'none' }}
                      >
                        {uploadingBanner ? 'Upload...' : team?.bannerUrl ? 'Changer la bannière' : 'Ajouter une bannière'}
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Inviter un joueur */}
              <div className={styles.section}>
                <h3>Inviter un joueur</h3>
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

              {/* Membres */}
              <div className={styles.section}>
                <h3>Membres ({team?.members.length || 0})</h3>
                <div className={styles.membersList}>
                  {team?.members.map((member: any) => (
                    <div key={member.id} className={styles.memberItem}>
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
                      {member.user.id !== (session?.user as any)?.id && !member.isCaptain && (
                        <div className={styles.memberActions}>
                          <Button 
                            variant="error" 
                            size="sm"
                            onClick={() => handleRemoveMember(member.user.id)}
                          >
                            Retirer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTransferCaptain(member.user.id)}
                          >
                            Transférer capitaine
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone de danger */}
              <div className={styles.dangerZone}>
                <h3>Zone de danger</h3>
                <p>La suppression de l'équipe est définitive. Tous les membres seront retirés.</p>
                <Button variant="error" onClick={handleDeleteTeam}>
                  Supprimer l'équipe
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
