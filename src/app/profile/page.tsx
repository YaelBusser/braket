'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import styles from './page.module.scss'
import { getCroppedImg } from '../../lib/image'

function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    pseudo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)

  // Update formData when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData({
        pseudo: session.user.name || ''
      })
    }
  }, [session])

  // Redirection hors rendu pour éviter les problèmes d'ordre des hooks
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  // Doit être défini avant tout return conditionnel pour respecter l'ordre des hooks
  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className="card">
          <div className="card-body">
            <div className="text-center">Chargement...</div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return
    // Ouvre le cropper avec l'image sélectionnée
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl)
    const url = URL.createObjectURL(file)
    setOriginalImageUrl(url)
    setShowCropper(true)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }


  const handleCancelCrop = () => {
    setShowCropper(false)
    setCroppedAreaPixels(null)
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl)
      setOriginalImageUrl(null)
    }
  }

  const handleConfirmCrop = async () => {
    if (!originalImageUrl || !croppedAreaPixels) return
    try {
      const blob = await getCroppedImg(originalImageUrl, croppedAreaPixels, 0)
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      setSelectedAvatar(file)

      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
      const previewUrl = URL.createObjectURL(blob)
      setAvatarPreviewUrl(previewUrl)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setShowCropper(false)
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
        setOriginalImageUrl(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log('Submitting profile update:', formData)
    console.log('Session user:', session?.user)

    try {
      let response: Response
      if (selectedAvatar) {
        const body = new FormData()
        body.append('pseudo', formData.pseudo)
        body.append('avatar', selectedAvatar)
        response = await fetch('/api/profile', {
          method: 'PUT',
          body,
        })
      } else {
        response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
      }

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok) {
        // Mettre à jour l'état local
        setFormData({
          pseudo: result.user.pseudo
        })

        // Mettre à jour la session NextAuth sans recharger la page
        try {
          await update({ name: result.user.pseudo, image: result.user.avatarUrl })
        } catch (e) {
          console.warn('Session update failed, but profile was updated in DB:', e)
        }

        setIsEditing(false)
        setSelectedAvatar(null)
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl)
          setAvatarPreviewUrl(null)
        }
      } else {
        // Show error message
        alert(`Erreur: ${result.message}`)
        console.error('Profile update error:', result)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Une erreur est survenue lors de la mise à jour du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
    <div className={styles.container}>
      <div className="container">
        <div className={styles.header}>
          <h1>Mon Profil</h1>
          <button onClick={handleLogout} className="btn btn-outline">
            Se déconnecter
          </button>
        </div>
        <div className={styles.profileContainer}>
        <div className="card">
          <div className="card-header">
            <h2>Informations personnelles</h2>
          </div>
          <div className="card-body">
            {!isEditing ? (
              <div className={styles.profileInfo}>
                <div className={styles.avatar}>
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="Avatar" />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <h3>{formData.pseudo}</h3>
                  <p className="text-secondary">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.avatarEditBlock}>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className={styles.avatarInputHidden}
                  />
                  <label htmlFor="avatar" className={styles.avatarEditable}>
                    {avatarPreviewUrl || session?.user?.image ? (
                      <img
                        src={avatarPreviewUrl || (session?.user?.image as string)}
                        alt="Avatar"
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {session?.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={styles.avatarEditOverlay}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
                        <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                      </svg>
                    </span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="pseudo" className="form-label form-label-required">
                    Pseudo
                  </label>
                  <input
                    type="text"
                    id="pseudo"
                    name="pseudo"
                    value={formData.pseudo}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>


                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Mes tournois</h2>
          </div>
          <div className="card-body">
            <MyTournaments />
          </div>
        </div>
        </div>
      </div>
    </div>

    {showCropper && (
      <div className={styles.modalBackdrop} onClick={handleCancelCrop}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.cropContainer}>
            <Cropper
              image={originalImageUrl || undefined}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className={styles.cropControls}>
            <label style={{ minWidth: 80 }}>Zoom</label>
            <input
              type="range"
              className={styles.slider}
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
          <div className={styles.cropActions}>
            <button type="button" className="btn btn-secondary" onClick={handleCancelCrop}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirmCrop}>Appliquer</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default function Profile() {
  return (
    <ClientPageWrapper>
      <ProfilePage />
    </ClientPageWrapper>
  )
}

function MyTournaments() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tournaments?mine=1')
        const data = await res.json()
        setItems(data.tournaments || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Chargement...</div>

  if (items.length === 0) {
    return (
      <div>
        <p className="text-muted" style={{ marginBottom: 12 }}>Aucun tournoi pour le moment.</p>
        <button className="btn btn-primary" onClick={() => router.push('/tournaments/create')}>
          Créer mon premier tournoi
        </button>
      </div>
    )
  }

  return (
    <ul style={{ display: 'grid', gap: 12 }}>
      {items.map(t => (
        <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{t.name}</strong>
            <div className="text-muted" style={{ marginTop: 4 }}>{t.game} · {t.format} · {t.visibility}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => router.push(`/tournaments/${t.id}`)}>Ouvrir</button>
            <button className="btn btn-secondary" onClick={() => router.push(`/tournaments/${t.id}/admin`)}>Gérer</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
