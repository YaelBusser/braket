'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardBody } from '../../components/ui'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import styles from './page.module.scss'

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    pseudo: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide'
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    if (!formData.pseudo) {
      newErrors.pseudo = 'Le pseudo est requis'
    } else if (formData.pseudo.length < 2) {
      newErrors.pseudo = 'Le pseudo doit contenir au moins 2 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          pseudo: formData.pseudo,
        }),
      })

      if (response.ok) {
        // Auto-login after successful registration
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          router.push('/profile')
        } else {
          router.push('/login')
        }
      } else {
        const data = await response.json()
        setErrors({ general: data.message || 'Une erreur est survenue' })
      }
    } catch (error) {
      setErrors({ general: 'Une erreur est survenue' })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <h1>Créer un compte</h1>
          <p>Rejoignez la communauté LeTournoi</p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className={styles.form}>
            {errors.general && (
              <div className={styles.errorMessage}>{errors.general}</div>
            )}

            <Input
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="votre@email.com"
              required
            />

            <Input
              type="text"
              name="pseudo"
              label="Pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              error={errors.pseudo}
              placeholder="Votre pseudo"
              required
            />


            <Input
              type="password"
              name="password"
              label="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Votre mot de passe"
              required
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirmez votre mot de passe"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            >
              Créer mon compte
            </Button>
          </form>

          <div className={styles.divider}>
            <span>ou</span>
          </div>

          {/* Temporairement désactivé
          <Button
            onClick={() => signIn('google', { callbackUrl: '/profile' })}
            variant="outline"
            size="lg"
          >
            Continuer avec Google
          </Button>
          */}

          <p className={styles.loginLink}>
            Déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

export default function Register() {
  return (
    <ClientPageWrapper>
      <RegisterPage />
    </ClientPageWrapper>
  )
}
