'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../providers/notification-provider'
import styles from './index.module.scss'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamCreated?: (teamId: string) => void
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamAvatar, setTeamAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Réinitialiser le formulaire
      setTeamName('')
      setTeamAvatar(null)
      setAvatarPreview(null)
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamName.trim()) {
      notify({ type: 'error', message: 'Veuillez entrer un nom d\'équipe' })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', teamName)
      if (teamAvatar) {
        formData.append('avatar', teamAvatar)
      }

      const res = await fetch('/api/teams', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la création de l\'équipe')
      }

      notify({ type: 'success', message: '🎉 Équipe créée avec succès !' })
      
      handleClose()
      
      if (onTeamCreated) {
        onTeamCreated(data.team.id)
      } else {
        // Rediriger vers la page de l'équipe
        router.push(`/teams/${data.team.id}`)
      }
    } catch (err) {
      notify({ type: 'error', message: `❌ ${(err as Error).message}` })
    } finally {
      setIsLoading(false)
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
          <h2>Créer une équipe</h2>
          <p className={styles.subtitle}>Formez votre équipe pour participer aux tournois</p>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.createMode}>
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
                    disabled={isLoading}
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
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      border: '1px solid #4b5563'
                    }}
                  >
                    {teamAvatar ? 'Changer' : 'Choisir un avatar'}
                  </label>
                  {teamAvatar && (
                    <button
                      type="button"
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
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !teamName.trim()}
            >
              {isLoading ? 'Création...' : 'Créer l\'équipe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
