'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useNotification } from '../providers/notification-provider'
import { useRouter } from 'next/navigation'
import SearchBar from '../ui/SearchBar'
import styles from './index.module.scss'

interface TeamSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  tournamentId: string
  tournament?: any // Pour récupérer teamMinSize et teamMaxSize
  onTeamJoined?: () => void
}

export default function TeamSelectionModal({ isOpen, onClose, tournamentId, tournament, onTeamJoined }: TeamSelectionModalProps) {
  const { data: session } = useSession()
  const { notify } = useNotification()
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'create' | 'selectMembers'>('select')
  const [teamName, setTeamName] = useState('')
  const [teamAvatar, setTeamAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [captainTeams, setCaptainTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [teamSearchQuery, setTeamSearchQuery] = useState('')

  // Filtrer et limiter les équipes selon la recherche
  const filteredTeams = useMemo(() => {
    let filtered = captainTeams
    if (teamSearchQuery.trim()) {
      const query = teamSearchQuery.toLowerCase().trim()
      filtered = captainTeams.filter(team => 
        team.name.toLowerCase().includes(query)
      )
    }
    return filtered.slice(0, 3) // Limiter à 3 équipes maximum
  }, [captainTeams, teamSearchQuery])

  useEffect(() => {
    if (isOpen) {
      setMode('select')
      setTeamName('')
      setTeamAvatar(null)
      setAvatarPreview(null)
      setSelectedTeam(null)
      setSelectedMembers([])
      setIsClosing(false)
      fetchCaptainTeams()
    }
  }, [isOpen, tournamentId])

  const fetchCaptainTeams = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/captain`)
      const data = await res.json()
      if (res.ok) {
        setCaptainTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Error fetching captain teams:', error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTeamAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      notify({ type: 'error', message: 'Veuillez entrer un nom d\'équipe' })
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('tournamentId', tournamentId)
      formData.append('name', teamName)
      if (teamAvatar) {
        formData.append('avatar', teamAvatar)
      }

      const res = await fetch('/api/teams', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        // Rediriger vers la page de gestion de l'équipe
        router.push(`/teams/${data.team.id}/manage`)
        handleClose()
      } else {
        notify({ type: 'error', message: data.message || '❌ Erreur lors de la création de l\'équipe' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur lors de la création de l\'équipe' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTeam = (team: any) => {
    setSelectedTeam(team)
    // Pré-sélectionner le capitaine
    const captainMember = team.members.find((m: any) => m.isCaptain)
    if (captainMember) {
      setSelectedMembers([captainMember.id])
    }
    setMode('selectMembers')
  }

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleRegisterTeam = async () => {
    if (!selectedTeam || selectedMembers.length === 0) {
      notify({ type: 'error', message: 'Veuillez sélectionner au moins un membre' })
      return
    }

    const participantCount = selectedMembers.length
    const minSize = tournament?.teamMinSize
    const maxSize = tournament?.teamMaxSize

    // Vérifier les contraintes avec messages d'erreur détaillés
    if (minSize && maxSize && minSize === maxSize) {
      // Si min et max sont identiques, message simplifié
      if (participantCount !== minSize) {
        notify({ 
          type: 'error', 
          message: `❌ Erreur : Vous devez sélectionner exactement ${minSize} participant${minSize > 1 ? 's' : ''}. Actuellement : ${participantCount} participant${participantCount > 1 ? 's' : ''}.` 
        })
        return
      }
    } else {
      if (minSize && participantCount < minSize) {
        notify({ 
          type: 'error', 
          message: `❌ Erreur : Vous devez sélectionner au moins ${minSize} participant${minSize > 1 ? 's' : ''}. Actuellement : ${participantCount} participant${participantCount > 1 ? 's' : ''}.` 
        })
        return
      }

      if (maxSize && participantCount > maxSize) {
        notify({ 
          type: 'error', 
          message: `❌ Erreur : Vous ne pouvez pas sélectionner plus de ${maxSize} participant${maxSize > 1 ? 's' : ''}. Actuellement : ${participantCount} participant${participantCount > 1 ? 's' : ''}.` 
        })
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          participantMemberIds: selectedMembers
        })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', message: '🎯 Équipe inscrite au tournoi avec succès !' })
        if (onTeamJoined) onTeamJoined()
        handleClose()
      } else {
        notify({ type: 'error', message: data.message || '❌ Erreur lors de l\'inscription' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur lors de l\'inscription' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`${styles.modalOverlay} ${isClosing ? styles.modalOverlayClosing : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fermer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.modalHeader}>
          <h2>Rejoindre le tournoi</h2>
          <p className={styles.subtitle}>
            {mode === 'selectMembers' 
              ? 'Sélectionnez les membres qui participeront au tournoi'
              : 'Choisissez une équipe existante ou créez-en une nouvelle'}
          </p>
        </div>

        <div className={styles.modalBody}>
          {mode === 'select' && (
            <div className={styles.selectMode}>
              {captainTeams.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Mes équipes</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <SearchBar
                      placeholder="Rechercher une équipe..."
                      onSearch={setTeamSearchQuery}
                      autoSearchDelay={300}
                      size="sm"
                      variant="dark"
                      hideButton={true}
                    />
                  </div>
                  {filteredTeams.length > 0 ? (
                    <div className={styles.teamsList} style={{ marginBottom: '2rem' }}>
                      {filteredTeams.map(team => (
                        <div key={team.id} className={styles.teamCard}>
                          <div className={styles.teamInfo}>
                            <div className={styles.teamHeader}>
                              {team.avatarUrl ? (
                                <img 
                                  src={team.avatarUrl} 
                                  alt={team.name}
                                  className={styles.teamLogo}
                                />
                              ) : (
                                <div className={styles.teamLogoPlaceholder}>
                                  {team.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <h4>{team.name}</h4>
                            </div>
                            <p>{team.members?.length || 0} membre{team.members?.length !== 1 ? 's' : ''}</p>
                          </div>
                          <button
                            className={styles.joinTeamButton}
                            onClick={() => handleSelectTeam(team)}
                            disabled={loading}
                          >
                            Sélectionner
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: '#9ca3af', 
                      fontSize: '0.875rem',
                      marginBottom: '2rem'
                    }}>
                      {teamSearchQuery.trim() 
                        ? 'Aucune équipe trouvée' 
                        : 'Aucune équipe disponible'}
                    </div>
                  )}
                  <div className={styles.divider}>
                    <span>ou</span>
                  </div>
                </>
              )}
              <button
                className={styles.actionButton}
                onClick={() => setMode('create')}
              >
                <div className={styles.actionIcon}>➕</div>
                <div className={styles.actionContent}>
                  <h3>Créer une équipe</h3>
                  <p>Créez votre propre équipe et invitez d'autres joueurs</p>
                </div>
              </button>

            </div>
          )}

          {mode === 'selectMembers' && selectedTeam && (() => {
            const participantCount = selectedMembers.length
            const minSize = tournament?.teamMinSize
            const maxSize = tournament?.teamMaxSize
            const isValidCount = 
              (!minSize || participantCount >= minSize) && 
              (!maxSize || participantCount <= maxSize)
            
            let errorMessage = ''
            if (participantCount > 0 && !isValidCount) {
              if (minSize && maxSize) {
                if (minSize === maxSize) {
                  // Si min et max sont identiques, message simplifié
                  errorMessage = `⚠️ Vous devez sélectionner exactement ${minSize} participant${minSize > 1 ? 's' : ''}. Actuellement : ${participantCount}.`
                } else {
                  if (participantCount < minSize) {
                    errorMessage = `⚠️ Vous devez sélectionner au moins ${minSize} participant${minSize > 1 ? 's' : ''}. Actuellement : ${participantCount}.`
                  } else if (participantCount > maxSize) {
                    errorMessage = `⚠️ Vous ne pouvez pas sélectionner plus de ${maxSize} participant${maxSize > 1 ? 's' : ''}. Actuellement : ${participantCount}.`
                  }
                }
              } else if (minSize && participantCount < minSize) {
                errorMessage = `⚠️ Vous devez sélectionner au moins ${minSize} participant${minSize > 1 ? 's' : ''}. Actuellement : ${participantCount}.`
              } else if (maxSize && participantCount > maxSize) {
                errorMessage = `⚠️ Vous ne pouvez pas sélectionner plus de ${maxSize} participant${maxSize > 1 ? 's' : ''}. Actuellement : ${participantCount}.`
              }
            }
            
            return (
              <div className={styles.selectMembersMode}>
                <button
                  className={styles.backButton}
                  onClick={() => {
                    setMode('select')
                    setSelectedTeam(null)
                    setSelectedMembers([])
                  }}
                >
                  ← Retour
                </button>
                <h3>Sélectionner les participants</h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                  {tournament?.teamMinSize && tournament?.teamMaxSize 
                    ? tournament.teamMinSize === tournament.teamMaxSize
                      ? `Sélectionnez ${tournament.teamMinSize} membre${tournament.teamMinSize > 1 ? 's' : ''}`
                      : `Sélectionnez entre ${tournament.teamMinSize} et ${tournament.teamMaxSize} membre${tournament.teamMaxSize > 1 ? 's' : ''}`
                    : tournament?.teamMinSize 
                      ? `Sélectionnez au moins ${tournament.teamMinSize} membre${tournament.teamMinSize > 1 ? 's' : ''}`
                      : tournament?.teamMaxSize
                        ? `Sélectionnez jusqu'à ${tournament.teamMaxSize} membre${tournament.teamMaxSize > 1 ? 's' : ''}`
                        : 'Sélectionnez les membres participants'
                  }
                </p>
                {errorMessage && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#7f1d1d',
                    border: '1px solid #991b1b',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {errorMessage}
                  </div>
                )}
                <div className={styles.membersList}>
                  {selectedTeam.members.map((member: any) => {
                    const isSelected = selectedMembers.includes(member.id)
                    return (
                      <label
                        key={member.id}
                        className={`${styles.memberItem} ${isSelected ? styles.memberItemSelected : ''}`}
                        style={{
                          cursor: member.isCaptain ? 'default' : 'pointer',
                          opacity: member.isCaptain ? 0.7 : 1
                        }}
                      >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleToggleMember(member.id)}
                        disabled={member.isCaptain} // Le capitaine est toujours sélectionné
                      />
                      <img
                        src={member.user?.avatarUrl || '/icons/icon_dark.svg'}
                        alt={member.user?.pseudo}
                        className={styles.memberAvatar}
                      />
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{member.user?.pseudo}</div>
                        {member.isCaptain && (
                          <div className={styles.memberRole}>Capitaine</div>
                        )}
                      </div>
                    </label>
                    )
                  })}
                </div>
                <button
                  className={styles.submitButton}
                  onClick={handleRegisterTeam}
                  disabled={loading || selectedMembers.length === 0 || !isValidCount}
                  style={{ 
                    marginTop: '1.5rem',
                    opacity: (selectedMembers.length === 0 || !isValidCount) ? 0.5 : 1,
                    cursor: (selectedMembers.length === 0 || !isValidCount) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Inscription...' : `Inscrire l'équipe (${selectedMembers.length} participant${selectedMembers.length > 1 ? 's' : ''})`}
                </button>
              </div>
            )
          })()}

          {mode === 'create' && (
            <div className={styles.createMode}>
              <button
                className={styles.backButton}
                onClick={() => setMode('select')}
              >
                ← Retour
              </button>
              <h3>Créer une équipe</h3>
              
              {/* Avatar */}
              <div className={styles.formGroup}>
                <label>Avatar de l'équipe (optionnel)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Preview" 
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #374151'
                      }}
                    />
                  ) : (
                    <img
                      src="/icons/icon_dark.svg"
                      alt="Default"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        padding: '12px',
                        background: '#374151',
                        border: '2px solid #374151'
                      }}
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={loading}
                      style={{ display: 'none' }}
                      id="team-avatar-upload"
                    />
                    <label
                      htmlFor="team-avatar-upload"
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: '#374151',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        border: '1px solid #4b5563'
                      }}
                    >
                      {teamAvatar ? 'Changer' : 'Choisir un avatar'}
                    </label>
                    {teamAvatar && (
                      <button
                        onClick={() => {
                          setTeamAvatar(null)
                          setAvatarPreview(null)
                        }}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Nom de l'équipe</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Les Champions"
                  maxLength={50}
                  disabled={loading}
                />
              </div>
              <button
                className={styles.submitButton}
                onClick={handleCreateTeam}
                disabled={loading || !teamName.trim()}
              >
                {loading ? 'Création...' : 'Créer l\'équipe'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
