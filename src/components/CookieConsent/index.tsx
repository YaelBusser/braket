'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui'
import styles from './index.module.scss'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      // Afficher la popup après un court délai pour une meilleure UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    window.dispatchEvent(new Event('cookie-consent-update'))
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={styles.cookieBanner}>
      <div className={styles.cookieContent}>
        <div className={styles.cookieText}>
          <h3 className={styles.cookieTitle}>🍪 Utilisation des cookies</h3>
          <p className={styles.cookieDescription}>
            Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic du site et personnaliser le contenu. 
            En continuant à utiliser ce site, vous acceptez notre utilisation des cookies.
          </p>
        </div>
        <div className={styles.cookieActions}>
          <Button
            variant="secondary"
            onClick={handleDecline}
            className={styles.declineButton}
          >
            Refuser
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            className={styles.acceptButton}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
