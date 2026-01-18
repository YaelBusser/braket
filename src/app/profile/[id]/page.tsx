'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  // Rediriger vers overview par défaut
  useEffect(() => {
    if (userId) {
      router.replace(`/profile/${userId}/overview`)
    }
  }, [userId, router])

  return null
}

export default PublicProfilePage
