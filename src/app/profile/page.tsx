'use client'

import { useSession, signOut, update } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import styles from './page.module.scss'

function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    pseudo: session?.user?.name || '',
    type: 'particulier' as 'particulier' | 'association' | 'entreprise'
  })
  const [isLoading, setIsLoading] = useState(false)

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

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the NextAuth session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: result.user.pseudo,
            // Keep other user data
          }
        })
        
        setIsEditing(false)
        // Update formData to reflect the changes
        setFormData(prev => ({
          ...prev,
          pseudo: result.user.pseudo,
          type: result.user.type
        }))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.header}>
          <h1>Mon Profil</h1>
          <button onClick={handleLogout} className="btn btn-outline">
            Se déconnecter
          </button>
        </div>

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
                  <h3>{session?.user?.name}</h3>
                  <p className="text-secondary">{session?.user?.email}</p>
                  <p className="text-muted">Type de compte: {formData.type}</p>
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

                <div className="form-group">
                  <label htmlFor="type" className="form-label form-label-required">
                    Type de compte
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="particulier">Particulier</option>
                    <option value="association">Association</option>
                    <option value="entreprise">Entreprise</option>
                  </select>
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
            <p className="text-muted">Aucun tournoi pour le moment.</p>
            <button className="btn btn-primary">
              Créer mon premier tournoi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <ClientPageWrapper>
      <ProfilePage />
    </ClientPageWrapper>
  )
}
