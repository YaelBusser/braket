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
        try {
          const redirect = localStorage.getItem('lt_returnTo')
          if (redirect) {
            localStorage.removeItem('lt_returnTo')
            router.push(redirect)
            return
          }
        } catch {}
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
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Se connecter</h1>
          <p className={styles.subtitle}>Accédez à votre compte LeTournoi</p>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {errors.general && (
              <div className={styles.errorMessage}>{errors.general}</div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Mot de passe <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Votre mot de passe"
                required
              />
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>ou</span>
          </div>

          <p className={styles.registerLink}>
            Pas encore de compte ? <a href="/register">Créer un compte</a>
          </p>
        </div>
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
