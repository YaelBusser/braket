'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import styles from './page.module.scss'

function LoginPage() {
  const { status } = useSession()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/profile')
    }
  }, [status, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setErrors({ general: 'Veuillez remplir tous les champs' })
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/profile')
      } else {
        setErrors({ general: 'Email ou mot de passe incorrect' })
      }
    } catch (error) {
      setErrors({ general: 'Une erreur est survenue' })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'authenticated') return null

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Se connecter</h1>
          <p>Accédez à votre compte LeTournoi</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className="form-error">{errors.general}</div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label form-label-required">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label form-label-required">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        {/* Temporairement désactivé
        <button
          onClick={() => signIn('google', { callbackUrl: '/profile' })}
          className="btn btn-outline btn-lg"
        >
          Continuer avec Google
        </button>
        */}

        <p className={styles.registerLink}>
          Pas encore de compte ? <a href="/register">Créer un compte</a>
        </p>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <ClientPageWrapper>
      <LoginPage />
    </ClientPageWrapper>
  )
}
