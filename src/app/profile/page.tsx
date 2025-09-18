'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import styles from './page.module.scss'

function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    pseudo: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Update formData when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData({
        pseudo: session.user.name || ''
      })
    }
  }, [session])

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

    console.log('Submitting profile update:', formData)
    console.log('Session user:', session?.user)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok) {
        // Update the form data with the response
        setFormData({
          pseudo: result.user.pseudo
        })
        setIsEditing(false)
        
        // Show success message
        alert('Profil mis à jour avec succès !')
        
        // Refresh the page to update the session
        window.location.reload()
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
