'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useNotification } from '../../../components/providers/notification-provider'
import { useAuthModal } from '../../../components/AuthModal/AuthModalContext'
import Button from '../../../components/ui/Button'
import Link from 'next/link'
import { Tabs, ContentWithTabs, TournamentCard } from '../../../components/ui'
import SettingsIcon from '../../../components/icons/SettingsIcon'
import styles from './page.module.scss'
import profileStyles from '../../profile/page.module.scss'

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
    status: string
    startDate: string
    endDate: string
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
    format?: string
    maxParticipants?: number | null
    isTeamBased?: boolean
    teamMinSize?: number | null
    teamMaxSize?: number | null
    createdAt?: string | null
    gameRef?: {
      id: string
      name: string
      imageUrl: string | null
      logoUrl: string | null
      posterUrl: string | null
    } | null
    organizer?: {
      id: string
      pseudo: string
      avatarUrl?: string | null
    } | null
    _count?: {
      registrations: number
    }
  }>
  members: Array<{
    id: string
    user: {
      id: string
      name?: string | null
      image?: string | null
      pseudo: string
      avatarUrl?: string | null
    }
    isCaptain: boolean
    createdAt: string
  }>
  createdAt: string
}

interface TeamStats {
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  totalTournaments: number
}

export default function TeamPage() {
  const params = useParams<{ id: string }>()
  return <TeamView teamId={params.id} />
}

function TeamView({ teamId }: { teamId: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const [team, setTeam] = useState<Team | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0
  })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'members' | 'tournaments'>('overview')
  const [isMember, setIsMember] = useState(false)
  const [isCaptain, setIsCaptain] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [myInvitations, setMyInvitations] = useState<any[]>([])
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null)
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', `/teams/${teamId}`) } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
    if (teamId) {
      loadTeamData()
    }
  }, [teamId, status, router, openAuthModal])

  // Vérifier si on arrive depuis une notification avec une invitation
  useEffect(() => {
    if (typeof window !== 'undefined' && team && myInvitations.length > 0 && !showInvitationModal) {
      const urlParams = new URLSearchParams(window.location.search)
      const invitationId = urlParams.get('invitation')
      if (invitationId) {
        const invitation = myInvitations.find((inv: any) => inv.id === invitationId)
        if (invitation) {
          setSelectedInvitation(invitation)
          setShowInvitationModal(true)
          // Nettoyer l'URL
          window.history.replaceState({}, '', `/teams/${teamId}`)
        }
      }
    }
  }, [team, myInvitations, teamId, showInvitationModal])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/team/${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setTeam(data)
        
        // Vérifier si l'utilisateur est membre de l'équipe
        if (session?.user) {
          const userId = (session.user as any).id
          const userIsMember = data.members.some((member: any) => member.user.id === userId)
          setIsMember(userIsMember)
          
          // Vérifier si l'utilisateur est le capitaine
          const captainMember = data.members.find((m: any) => m.isCaptain)
          const userIsCaptain = captainMember?.user.id === userId
          setIsCaptain(userIsCaptain)

          // Charger les invitations
          try {
            // Invitations de l'équipe (pour le capitaine)
            if (userIsCaptain) {
              const invitationsRes = await fetch(`/api/teams/invitations?teamId=${teamId}&status=PENDING`)
              if (invitationsRes.ok) {
                const invitationsData = await invitationsRes.json()
                setPendingInvitations(invitationsData.invitations || [])
              }
            }

            // Invitations reçues par l'utilisateur pour cette équipe
            const myInvitationsRes = await fetch(`/api/teams/invitations?status=PENDING`)
            if (myInvitationsRes.ok) {
              const myInvitationsData = await myInvitationsRes.json()
              const teamInvitations = (myInvitationsData.invitations || []).filter(
                (inv: any) => inv.team.id === teamId
              )
              setMyInvitations(teamInvitations)
            }
          } catch (error) {
            console.error('Error loading invitations:', error)
          }
        }
      } else {
        notify({ message: 'Équipe introuvable', type: 'error' })
        router.push('/teams')
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors du chargement de l\'équipe', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Écouter les événements de désinscription/inscription pour recharger les données
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleTournamentRegistrationChange = () => {
      // Recharger les données de l'équipe pour mettre à jour la liste des tournois
      loadTeamData()
    }

    window.addEventListener('tournament-unregistration-changed', handleTournamentRegistrationChange)
    window.addEventListener('tournament-registration-changed', handleTournamentRegistrationChange)

    return () => {
      window.removeEventListener('tournament-unregistration-changed', handleTournamentRegistrationChange)
      window.removeEventListener('tournament-registration-changed', handleTournamentRegistrationChange)
    }
  }, [teamId])

  const openInvitationModal = (invitation: any) => {
    setSelectedInvitation(invitation)
    setShowInvitationModal(true)
  }

  const closeInvitationModal = () => {
    setShowInvitationModal(false)
    setSelectedInvitation(null)
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Invitation acceptée ! Vous avez rejoint l\'équipe 🎉', type: 'success' })
        closeInvitationModal()
        loadTeamData()
      } else {
        notify({ message: data.message || 'Erreur lors de l\'acceptation', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de l\'acceptation', type: 'error' })
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ message: 'Invitation refusée', type: 'info' })
        closeInvitationModal()
        loadTeamData()
      } else {
        notify({ message: data.message || 'Erreur lors du refus', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors du refus', type: 'error' })
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
        notify({ message: 'Invitation annulée', type: 'success' })
        loadTeamData()
      } else {
        notify({ message: data.message || 'Erreur lors de l\'annulation', type: 'error' })
      }
    } catch (error) {
      notify({ message: 'Erreur lors de l\'annulation', type: 'error' })
    }
  }

  const openJoinTeamModal = () => {
    if (!session?.user) {
      try { localStorage.setItem('lt_returnTo', `/teams/${teamId}`) } catch {}
      openAuthModal('login')
      return
    }
    setShowJoinTeamModal(true)
  }

  const closeJoinTeamModal = () => {
    setShowJoinTeamModal(false)
  }

  const handleJoinTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST'
      })

      if (res.ok) {
        notify({ message: 'Vous avez rejoint l\'équipe ! 🎉', type: 'success' })
        closeJoinTeamModal()
        loadTeamData()
      } else {
        const error = await res.json()
        notify({ message: error.message || 'Erreur lors de la participation à l\'équipe', type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors de la participation à l\'équipe', type: 'error' })
    }
  }


  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de l'équipe...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!team) {
    return (
      <div className={styles.error}>
        <h2>Équipe introuvable</h2>
        <p>Cette équipe n'existe pas ou a été supprimée</p>
        <button 
          className={styles.backBtn}
          onClick={() => router.push('/teams')}
        >
          Retour aux équipes
        </button>
      </div>
    )
  }

  const bannerUrl = team.bannerUrl || null

  return (
    <div className={styles.teamPage}>
      {/* Bannière hero */}
      <div 
        className={styles.banner}
        style={{
          backgroundImage: bannerUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url(${bannerUrl})`
            : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className={styles.bannerContent}>
          <div className={styles.bannerInner}>
            {/* Avatar circulaire */}
            {team.avatarUrl ? (
              <img 
                src={team.avatarUrl} 
                alt={team.name}
                className={styles.profilePicture}
              />
            ) : (
              <img
                src="/icons/icon_dark.svg"
                alt={team.name}
                className={styles.profilePicture}
                style={{
                  padding: '20px',
                  background: '#1a1f2e',
                  objectFit: 'contain'
                }}
              />
            )}
            
            {/* Infos de l'équipe */}
            <div className={styles.bannerInfo}>
              <h1 className={styles.title}>{team.name}</h1>
              
              {team.tournaments && team.tournaments.length > 0 && (
                <div className={styles.eventDetails}>
                  <span>{team.tournaments.length} tournoi{team.tournaments.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            {/* Section droite avec bouton */}
            <div className={styles.bannerRight}>
              {!isMember && (
                <Button 
                  variant="primary"
                  onClick={openJoinTeamModal}
                >
                  Rejoindre l'équipe
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation et contenu principal */}
      <ContentWithTabs style={{ marginTop: '3rem' }}>
        {/* Navigation par onglets */}
        <Tabs
          tabs={[
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'members', label: 'Membres' },
            { key: 'tournaments', label: 'Tournois' }
          ]}
          activeTab={tab}
          onTabChange={(key) => setTab(key as any)}
        >
          {/* Bouton Paramètres pour les membres */}
          {isMember && (
            <Link
              href={`/teams/${teamId}/manage`}
              className={profileStyles.settingsButton}
            >
              <SettingsIcon width={20} height={20} />
              <span>Paramètres</span>
            </Link>
          )}
        </Tabs>

        {/* Contenu principal */}
        <div className={profileStyles.tabContent}>
          {tab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Membres</h3>
                  <div className={styles.statNumber}>{team.members.length}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Matchs joués</h3>
                  <div className={styles.statNumber}>{teamStats.totalMatches}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Victoires</h3>
                  <div className={styles.statNumber}>{teamStats.wins}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Taux de victoire</h3>
                  <div className={styles.statNumber}>{teamStats.winRate}%</div>
                </div>
              </div>

              <div className={styles.teamInfo}>
                <h3>Informations de l'équipe</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Date de création</label>
                    <p>{new Date(team.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {team.description && (
                    <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                      <label>Description</label>
                      <p>{team.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className={styles.membersTab}>
              <div className={styles.tabHeader}>
                <h3>Membres de l'équipe</h3>
                <div className={styles.memberCount}>
                  {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                </div>
              </div>

              <div className={styles.membersList}>
                {team.members.map((member) => {
                  const isCurrentUser = session?.user && (session.user as any).id === member.user.id
                  return (
                  <Link 
                    key={member.id} 
                    href={`/profile/${member.user.id}`}
                    className={styles.memberItem}
                  >
                    <div className={styles.memberAvatar}>
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt={member.user.name || member.user.pseudo} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {(member.user.name || member.user.pseudo)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {member.isCaptain && (
                        <div className={styles.captainBadge}>C</div>
                      )}
                    </div>
                    <div className={styles.memberInfo}>
                      <h4>{member.user.name || member.user.pseudo}</h4>
                      {member.isCaptain && (
                        <span className={styles.captainBadgeText}>Capitaine</span>
                      )}
                    </div>
                  </Link>
                  )
                })}
              </div>

              {/* Invitations reçues par l'utilisateur */}
              {!isMember && myInvitations.length > 0 && (
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
                    Invitation reçue
                  </h4>
                  {myInvitations.map((invitation: any) => (
                    <div key={invitation.id} className={styles.memberCard} style={{
                      borderColor: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.05)'
                    }}>
                      <div className={styles.memberInfo}>
                        {invitation.invitedBy.avatarUrl ? (
                          <img src={invitation.invitedBy.avatarUrl} alt={invitation.invitedBy.pseudo} className={styles.memberAvatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {invitation.invitedBy.pseudo.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className={styles.memberName} style={{ fontSize: '0.875rem' }}>
                            Invité par {invitation.invitedBy.pseudo}
                          </div>
                          <div className={styles.memberDate} style={{ fontSize: '0.75rem' }}>
                            Le {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openInvitationModal(invitation)}
                        style={{
                          background: '#ff008c',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          color: '#fff',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#cc0070'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ff008c'
                        }}
                      >
                        Répondre à l'invitation
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Invitations envoyées par le capitaine */}
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
                            <div className={styles.avatarPlaceholder}>
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
            </div>
          )}


          {tab === 'tournaments' && (
            <div className={styles.tournamentsTab}>
              <div className={styles.tabHeader}>
                <h3>Participations aux tournois</h3>
                {team.tournaments && team.tournaments.length > 0 && (
                  <div className={styles.memberCount}>
                    {team.tournaments.length} tournoi{team.tournaments.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {team.tournaments && team.tournaments.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginTop: '1.5rem'
                }}>
                  {team.tournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      userId={(session?.user as any)?.id || null}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🏆</div>
                  <h3>Aucun tournoi</h3>
                  <p>Cette équipe n'a pas encore participé à un tournoi</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ContentWithTabs>

      {/* Modale de rejoindre l'équipe */}
      {showJoinTeamModal && team && (
        <div className={styles.modalOverlay} onClick={closeJoinTeamModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Rejoindre l'équipe</h2>
              <button className={styles.modalClose} onClick={closeJoinTeamModal}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.invitationTeamInfo}>
                {team.avatarUrl ? (
                  <img src={team.avatarUrl} alt={team.name} className={styles.invitationTeamAvatar} />
                ) : (
                  <div className={styles.invitationTeamAvatarPlaceholder}>
                    👥
                  </div>
                )}
                <div>
                  <h3>{team.name}</h3>
                  {team.tournaments && team.tournaments.length > 0 && (
                    <p className={styles.invitationTeamTournament}>
                      {team.tournaments.length} tournoi{team.tournaments.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {team.description && (
                <div className={styles.invitationDescription}>
                  <p><strong>Description de l'équipe :</strong></p>
                  <p>{team.description}</p>
                </div>
              )}

              <div className={styles.invitationInvitedBy}>
                <p><strong>Membres actuels :</strong> {team.members.length} membre{team.members.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.modalButton} ${styles.modalButtonReject}`}
                onClick={closeJoinTeamModal}
              >
                Annuler
              </button>
              <button
                className={`${styles.modalButton} ${styles.modalButtonAccept}`}
                onClick={handleJoinTeam}
              >
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'invitation */}
      {showInvitationModal && selectedInvitation && (
        <div className={styles.modalOverlay} onClick={closeInvitationModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Invitation à rejoindre l'équipe</h2>
              <button className={styles.modalClose} onClick={closeInvitationModal}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.invitationTeamInfo}>
                {team?.avatarUrl ? (
                  <img src={team.avatarUrl} alt={team.name} className={styles.invitationTeamAvatar} />
                ) : (
                  <div className={styles.invitationTeamAvatarPlaceholder}>
                    👥
                  </div>
                )}
                <div>
                  <h3>{team?.name}</h3>
                  {team?.tournaments && team.tournaments.length > 0 && (
                    <p className={styles.invitationTeamTournament}>
                      {team.tournaments.length} tournoi{team.tournaments.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.invitationInvitedBy}>
                <p>Vous avez été invité par :</p>
                <div className={styles.invitationInviterInfo}>
                  {selectedInvitation.invitedBy.avatarUrl ? (
                    <img 
                      src={selectedInvitation.invitedBy.avatarUrl} 
                      alt={selectedInvitation.invitedBy.pseudo} 
                      className={styles.invitationInviterAvatar} 
                    />
                  ) : (
                    <div className={styles.invitationInviterAvatarPlaceholder}>
                      {selectedInvitation.invitedBy.pseudo.charAt(0)}
                    </div>
                  )}
                  <span>{selectedInvitation.invitedBy.pseudo}</span>
                </div>
                <p className={styles.invitationDate}>
                  Le {new Date(selectedInvitation.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {team?.description && (
                <div className={styles.invitationDescription}>
                  <p><strong>Description de l'équipe :</strong></p>
                  <p>{team.description}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.modalButton} ${styles.modalButtonReject}`}
                onClick={() => handleRejectInvitation(selectedInvitation.id)}
              >
                Refuser
              </button>
              <button
                className={`${styles.modalButton} ${styles.modalButtonAccept}`}
                onClick={() => handleAcceptInvitation(selectedInvitation.id)}
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
