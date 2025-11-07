'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../ui'

interface ClientPageWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ClientPageWrapper({ 
  children, 
  fallback = <LoadingSpinner text="Chargement de la page..." />
}: ClientPageWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

