'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './index.module.scss'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { status } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    pseudo: '',
    rememberMe: false,
    isEnterprise: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && isOpen) {
      onClose()
      try {
        const redirect = localStorage.getItem('lt_returnTo')
        if (redirect) {
          localStorage.removeItem('lt_returnTo')
          router.push(redirect)
          return
        }
      } catch {}
      router.push('/my-tournaments')
    }
  }, [status, isOpen, onClose, router])

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        pseudo: '',
        rememberMe: false,
        isEnterprise: false
      })
      setErrors({})
    }
  }, [isOpen, initialMode])

  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll du body et cacher sa scrollbar
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurer le scroll du body
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
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

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }

      if (!formData.pseudo) {
        newErrors.pseudo = 'Le pseudo est requis'
      } else if (formData.pseudo.length < 2) {
        newErrors.pseudo = 'Le pseudo doit contenir au moins 2 caractères'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
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
        onClose()
        try {
          const redirect = localStorage.getItem('lt_returnTo')
          if (redirect) {
            localStorage.removeItem('lt_returnTo')
            router.push(redirect)
            return
          }
        } catch {}
        router.push('/my-tournaments')
      } else {
        setErrors({ general: 'Email ou mot de passe incorrect' })
      }
    } catch (error) {
      setErrors({ general: 'Une erreur est survenue' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
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
          isEnterprise: formData.isEnterprise,
        }),
      })

      if (response.ok) {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          onClose()
          const sp = new URLSearchParams(window.location.search)
          const returnTo = sp.get('returnTo')
          router.push(returnTo || '/my-tournaments')
        } else {
          setErrors({ general: 'Compte créé mais connexion échouée. Veuillez vous connecter.' })
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

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.modalBody}>
          {mode === 'login' ? (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.title}>Se connecter</h2>
                <p className={styles.subtitle}>
                  Vous n'avez pas de compte ?{' '}
                  <button
                    type="button"
                    className={styles.switchLink}
                    onClick={() => {
                      setMode('register')
                      setErrors({})
                    }}
                  >
                    Inscrivez-vous
                  </button>
                </p>
              </div>

              {/* Checkbox entreprise */}
              <div className={styles.enterpriseCheckboxContainer}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    name="isEnterprise"
                    checked={formData.isEnterprise}
                    onChange={handleChange}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSwitch}></span>
                  <span className={styles.toggleText}>Je suis une entreprise</span>
                </label>
                {formData.isEnterprise && (
                  <div className={styles.accountTypeBanner}>
                    <div className={`${styles.accountTypeBadge} ${styles.accountTypeBadgeEnterprise}`}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>
                      </svg>
                      <span>Compte entreprise</span>
                    </div>
                    <p className={styles.accountTypeNote}>
                      Connexion par email uniquement - Les connexions Google/Discord ne sont pas disponibles
                    </p>
                  </div>
                )}
              </div>

              {/* Boutons de connexion sociale - Masqués si entreprise */}
              {!formData.isEnterprise && (
                <>
                  <div className={styles.socialButtons}>
                <button
                  type="button"
                  className={`${styles.socialButton} ${styles.discordButton}`}
                  onClick={() => signIn('discord', { callbackUrl: '/my-tournaments' })}
                >
                  <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Connectez-vous à Discord
                </button>
                <button
                  type="button"
                  className={`${styles.socialButton} ${styles.googleButton}`}
                  onClick={() => signIn('google', { callbackUrl: '/my-tournaments' })}
                >
                  <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connectez-vous à Google
                </button>
                  </div>

                  {/* Séparateur */}
                  <div className={styles.divider}>
                    <span>Ou</span>
                  </div>
                </>
              )}

              {/* Formulaire email/password */}
              <form onSubmit={handleLogin} className={styles.form}>
                {errors.general && (
                  <div className={styles.errorMessage}>{errors.general}</div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Adresse e-mail"
                    required
                  />
                  {errors.email && (
                    <div className={styles.errorText}>{errors.email}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Mot de passe"
                    required
                  />
                  {errors.password && (
                    <div className={styles.errorText}>{errors.password}</div>
                  )}
                </div>

                <div className={styles.rememberMe}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                      className={styles.toggleInput}
                    />
                    <span className={styles.toggleSwitch}></span>
                    <span className={styles.toggleText}>Se souvenir de moi</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submitButton}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.title}>S'inscrire</h2>
                <p className={styles.subtitle}>
                  Vous avez déjà un compte ?{' '}
                  <button
                    type="button"
                    className={styles.switchLink}
                    onClick={() => {
                      setMode('login')
                      setErrors({})
                    }}
                  >
                    Se connecter
                  </button>
                </p>
                <p className={styles.subtitleSecondary}>
                  Rejoignez la communauté LeTournoi
                </p>
              </div>

              {/* Checkbox entreprise */}
              <div className={styles.enterpriseCheckboxContainer}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    name="isEnterprise"
                    checked={formData.isEnterprise}
                    onChange={handleChange}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSwitch}></span>
                  <span className={styles.toggleText}>Je suis une entreprise</span>
                </label>
                {formData.isEnterprise && (
                  <div className={styles.accountTypeBanner}>
                    <div className={`${styles.accountTypeBadge} ${styles.accountTypeBadgeEnterprise}`}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>
                      </svg>
                      <span>Compte entreprise</span>
                    </div>
                    <p className={styles.accountTypeNote}>
                      Inscription par email uniquement - Les connexions Google/Discord ne sont pas disponibles
                    </p>
                  </div>
                )}
              </div>

              {/* Boutons de connexion sociale - Masqués si entreprise */}
              {!formData.isEnterprise && (
                <>
                  <div className={styles.socialButtons}>
                    <button
                      type="button"
                      className={`${styles.socialButton} ${styles.discordButton}`}
                      onClick={() => signIn('discord', { callbackUrl: '/my-tournaments' })}
                    >
                      <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      S'inscrire avec Discord
                    </button>
                    <button
                      type="button"
                      className={`${styles.socialButton} ${styles.googleButton}`}
                      onClick={() => signIn('google', { callbackUrl: '/my-tournaments' })}
                    >
                      <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      S'inscrire avec Google
                    </button>
                  </div>

                  {/* Séparateur */}
                  <div className={styles.divider}>
                    <span>Ou</span>
                  </div>
                </>
              )}

              <form onSubmit={handleRegister} className={styles.form}>
                {errors.general && (
                  <div className={styles.errorMessage}>{errors.general}</div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="register-email" className={styles.label}>
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Adresse e-mail"
                    required
                  />
                  {errors.email && (
                    <div className={styles.errorText}>{errors.email}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="register-pseudo" className={styles.label}>
                    Pseudo
                  </label>
                  <input
                    type="text"
                    id="register-pseudo"
                    name="pseudo"
                    value={formData.pseudo}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Votre pseudo"
                    required
                  />
                  {errors.pseudo && (
                    <div className={styles.errorText}>{errors.pseudo}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="register-password" className={styles.label}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    id="register-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Mot de passe"
                    required
                  />
                  {errors.password && (
                    <div className={styles.errorText}>{errors.password}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="register-confirmPassword" className={styles.label}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    id="register-confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                  {errors.confirmPassword && (
                    <div className={styles.errorText}>{errors.confirmPassword}</div>
                  )}
                </div>

              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? 'Inscription...' : "S'inscrire gratuitement"}
              </button>

              <p className={styles.termsText}>
                En cliquant sur "S'inscrire gratuitement", vous acceptez les{' '}
                <a href="/terms" className={styles.termsLink}>Conditions d'utilisation</a>
                {' '}et la{' '}
                <a href="/privacy" className={styles.termsLink}>Politique de confidentialité</a>
                {' '}de LeTournoi.
              </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

