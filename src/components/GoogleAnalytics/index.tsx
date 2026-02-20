'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const GA_ID = 'G-M1QB9QE7Y3'

export default function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (consent === 'accepted') {
      setConsentGiven(true)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cookie-consent' && e.newValue === 'accepted') {
        setConsentGiven(true)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const handleConsent = () => {
      const consent = localStorage.getItem('cookie-consent')
      if (consent === 'accepted') {
        setConsentGiven(true)
      }
    }

    window.addEventListener('cookie-consent-update', handleConsent)
    return () => window.removeEventListener('cookie-consent-update', handleConsent)
  }, [])

  if (!consentGiven) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
