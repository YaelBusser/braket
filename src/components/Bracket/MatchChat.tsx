'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useNotification } from '../providers/notification-provider'
import styles from './MatchChat.module.scss'

interface User {
  id: string
  pseudo: string
  avatarUrl?: string | null
}

interface MatchMessage {
  id: string
  message: string
  imageUrl?: string | null
  createdAt: string
  user: User
}

interface MatchResultVote {
  id: string
  votedFor: 'teamA' | 'teamB'
  user: User
}

interface MatchChatProps {
  matchId: string
  teamAId: string
  teamBId: string
  teamAName: string
  teamBName: string
  teamAAvatarUrl?: string | null
  teamBAvatarUrl?: string | null
  round?: number
  totalSlots?: number
  isAdmin: boolean
  matchStatus?: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  onClose: () => void
  onMatchResolved?: () => void
}

export default function MatchChat({ matchId, teamAId, teamBId, teamAName, teamBName, teamAAvatarUrl, teamBAvatarUrl, round, totalSlots = 8, isAdmin, matchStatus, onClose, onMatchResolved }: MatchChatProps) {
  const { data: session } = useSession()
  const { notify } = useNotification()
  const userId = (session?.user as any)?.id
  const [messages, setMessages] = useState<MatchMessage[]>([])
  const [votes, setVotes] = useState<MatchResultVote[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [votedFor, setVotedFor] = useState<'teamA' | 'teamB' | null>(null)
  const [isAutoResolving, setIsAutoResolving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoResolveInProgressRef = useRef(false)
  const previousVotesRef = useRef<string>('')

  // Calculer le nom du round
  const getRoundName = (roundNum: number) => {
    if (!roundNum || !totalSlots) return ''
    const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
    const totalRounds = Math.ceil(Math.log2(normalizedSlots))
    const roundsFromEnd = totalRounds - roundNum + 1
    
    switch (roundsFromEnd) {
      case 1: return 'Finale'
      case 2: return 'Demi-finales'
      case 3: return 'Quarts de finale'
      case 4: return 'Huitièmes'
      case 5: return 'Seizièmes'
      case 6: return 'Trente-deuxièmes'
      default: return `Tour ${roundNum}`
    }
  }

  // Charger les messages et votes
  useEffect(() => {
    loadMessages()
    loadVotes()
    // Polling pour les nouveaux messages
    const interval = setInterval(() => {
      loadMessages()
      loadVotes()
    }, 3000)
    return () => clearInterval(interval)
  }, [matchId])

  // Vérifier si les deux équipes sont d'accord et résoudre automatiquement
  useEffect(() => {
    // Ne pas vérifier si le match est déjà terminé
    if (matchStatus === 'COMPLETED') return

    // Créer une signature des votes pour détecter les vrais changements
    const votesSignature = JSON.stringify(votes.map(v => ({ votedFor: v.votedFor, userId: v.user.id })).sort((a, b) => a.userId.localeCompare(b.userId)))
    
    // Ne pas vérifier si les votes n'ont pas vraiment changé
    if (votesSignature === previousVotesRef.current) return
    previousVotesRef.current = votesSignature

    // Ne pas vérifier si on est déjà en train de résoudre ou si on n'a pas exactement 2 votes
    if (autoResolveInProgressRef.current || isAutoResolving || votes.length !== 2) return

    // Vérifier que les deux votes sont pour la même équipe (accord)
    const teamAVotes = votes.filter(v => v.votedFor === 'teamA')
    const teamBVotes = votes.filter(v => v.votedFor === 'teamB')

    // Si les deux votes sont pour la même équipe, appeler l'API pour vérifier et résoudre
    // L'API vérifiera côté serveur que les votes viennent bien des deux équipes
    const bothAgreeOnTeamA = teamAVotes.length === 2 && teamBVotes.length === 0
    const bothAgreeOnTeamB = teamBVotes.length === 2 && teamAVotes.length === 0

    if (bothAgreeOnTeamA || bothAgreeOnTeamB) {
      // Marquer qu'on est en train de résoudre pour éviter les appels multiples
      autoResolveInProgressRef.current = true
      setIsAutoResolving(true)
      
      fetch(`/api/matches/${matchId}/auto-resolve`, {
        method: 'POST'
      })
        .then(res => {
          if (res.ok) {
            notify({ type: 'success', message: 'Match terminé automatiquement : accord des deux équipes' })
            // Déclencher un événement pour mettre à jour les matchs en temps réel
            window.dispatchEvent(new CustomEvent('match-resolved', { detail: { matchId, tournamentId: null } }))
            // Appeler le callback si fourni
            if (onMatchResolved) {
              onMatchResolved()
            }
          }
        })
        .catch(error => {
          console.error('Error auto-resolving match:', error)
        })
        .finally(() => {
          setIsAutoResolving(false)
          // Réinitialiser le ref après un délai pour permettre une nouvelle vérification si nécessaire
          setTimeout(() => {
            autoResolveInProgressRef.current = false
          }, 2000)
        })
    }
  }, [votes, matchId, matchStatus, isAutoResolving, notify, onMatchResolved])

  // Scroll vers le bas quand de nouveaux messages arrivent (seulement si l'utilisateur est déjà en bas)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    // Vérifier si l'utilisateur est déjà près du bas (dans les 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    
    // Scroller seulement si l'utilisateur est déjà en bas ou si c'est le premier chargement
    if (isNearBottom || messages.length <= 1) {
      // Utiliser scrollTop au lieu de scrollIntoView pour éviter de scroller toute la page
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 0)
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadVotes = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/result-vote`)
      if (res.ok) {
        const data = await res.json()
        setVotes(data.votes || [])
        // Trouver le vote de l'utilisateur actuel
        const userVote = data.votes?.find((v: MatchResultVote) => v.user.id === userId)
        setVotedFor(userVote?.votedFor || null)
      }
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify({ type: 'error', message: 'L\'image ne doit pas dépasser 5MB' })
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return
    
    // Ne pas permettre l'envoi de messages si le match est terminé
    if (matchStatus === 'COMPLETED') {
      notify({ type: 'error', message: 'Le match est terminé, vous ne pouvez plus envoyer de messages' })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      if (newMessage.trim()) {
        formData.append('message', newMessage)
      }
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const error = await res.json()
        notify({ type: 'error', message: error.message || 'Erreur lors de l\'envoi du message' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de l\'envoi du message' })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (team: 'teamA' | 'teamB') => {
    // Ne pas permettre les votes si le match est terminé
    if (matchStatus === 'COMPLETED') {
      notify({ type: 'error', message: 'Le match est terminé, vous ne pouvez plus voter' })
      return
    }
    
    try {
      const res = await fetch(`/api/matches/${matchId}/result-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votedFor: team })
      })

      if (res.ok) {
        await loadVotes()
        notify({ type: 'success', message: 'Vote enregistré' })
      } else {
        const error = await res.json()
        notify({ type: 'error', message: error.message || 'Erreur lors du vote' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors du vote' })
    }
  }

  const handleResolveResult = async (winnerTeamId: string) => {
    if (!isAdmin) return
    
    try {
      const res = await fetch(`/api/matches/${matchId}/resolve-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerTeamId })
      })

      if (res.ok) {
        notify({ type: 'success', message: 'Résultat validé par l\'admin' })
        // Déclencher un événement pour mettre à jour les matchs en temps réel
        window.dispatchEvent(new CustomEvent('match-resolved', { detail: { matchId, tournamentId: null } }))
        // Appeler le callback si fourni
        if (onMatchResolved) {
          onMatchResolved()
        }
      } else {
        const error = await res.json()
        notify({ type: 'error', message: error.message || 'Erreur lors de la validation' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur lors de la validation' })
    }
  }

  const teamAVotes = votes.filter(v => v.votedFor === 'teamA').length
  const teamBVotes = votes.filter(v => v.votedFor === 'teamB').length

  return (
    <div className={styles.matchChat}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.chatHeaderTeams}>
            <div className={styles.chatTeamInfo}>
              <div className={styles.chatTeamLogo}>
                {teamAAvatarUrl ? (
                  <img src={teamAAvatarUrl} alt={teamAName} />
                ) : (
                  <span>{teamAName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className={styles.chatTeamName}>{teamAName}</span>
            </div>
            <span className={styles.chatVS}>VS</span>
            <div className={styles.chatTeamInfo}>
              <div className={styles.chatTeamLogo}>
                {teamBAvatarUrl ? (
                  <img src={teamBAvatarUrl} alt={teamBName} />
                ) : (
                  <span>{teamBName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className={styles.chatTeamName}>{teamBName}</span>
            </div>
          </div>
        </div>
        <div className={styles.chatHeaderRight}>
          {round && <span className={styles.chatRoundName}>{getRoundName(round)}</span>}
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
      </div>

      {/* Section de vote de résultat */}
      {matchStatus === 'COMPLETED' && (
        <div className={styles.voteSection}>
          <p style={{ color: 'var(--lt-text-secondary)', fontStyle: 'italic', margin: 0 }}>
            Ce match est terminé. Vous pouvez consulter l'historique du chat ci-dessous.
          </p>
        </div>
      )}
      {matchStatus !== 'COMPLETED' && (
      <div className={styles.voteSection}>
        <h4 className={styles.voteTitle}>Résultat du match</h4>
        <div className={styles.voteButtons}>
          <button
            className={`${styles.voteButton} ${votedFor === 'teamA' ? styles.voteButtonActive : ''}`}
            onClick={() => handleVote('teamA')}
            disabled={loading}
          >
            {teamAName} gagne ({teamAVotes})
          </button>
          <button
            className={`${styles.voteButton} ${votedFor === 'teamB' ? styles.voteButtonActive : ''}`}
            onClick={() => handleVote('teamB')}
            disabled={loading}
          >
            {teamBName} gagne ({teamBVotes})
          </button>
        </div>
        {teamAVotes > 0 && teamBVotes > 0 && (
          <>
            <p className={styles.voteWarning}>
              ⚠️ Désaccord détecté. L'admin peut trancher.
            </p>
            {isAdmin && (
              <div className={styles.adminResolveButtons}>
                <button
                  className={styles.resolveButton}
                  onClick={() => handleResolveResult(teamAId)}
                  disabled={loading}
                >
                  Valider {teamAName} gagnant
                </button>
                <button
                  className={styles.resolveButton}
                  onClick={() => handleResolveResult(teamBId)}
                  disabled={loading}
                >
                  Valider {teamBName} gagnant
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <p className={styles.emptyMessage}>Aucun message pour le moment</p>
        ) : (
          messages.map(message => (
            <div key={message.id} className={styles.message}>
              <div className={styles.messageHeader}>
                {message.user.avatarUrl ? (
                  <img src={message.user.avatarUrl} alt={message.user.pseudo} className={styles.messageAvatar} />
                ) : (
                  <div className={styles.messageAvatarPlaceholder}>
                    {message.user.pseudo.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.messageAuthor}>{message.user.pseudo}</span>
                <span className={styles.messageTime}>
                  {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.message && (
                <p className={styles.messageText}>{message.message}</p>
              )}
              {message.imageUrl && (
                <img src={message.imageUrl} alt="Preuve" className={styles.messageImage} />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Désactivé si le match est terminé */}
      {matchStatus !== 'COMPLETED' && (
      <div className={styles.chatInput}>
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" />
            <button
              className={styles.removeImageButton}
              onClick={() => {
                setSelectedImage(null)
                setImagePreview(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className={styles.inputRow}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Écrire un message..."
            className={styles.messageInput}
            disabled={loading}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            id={`image-input-${matchId}`}
          />
          <label htmlFor={`image-input-${matchId}`} className={styles.imageButton}>
            📷
          </label>
          <button
            onClick={handleSendMessage}
            disabled={loading || (!newMessage.trim() && !selectedImage)}
            className={styles.sendButton}
          >
            Envoyer
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
