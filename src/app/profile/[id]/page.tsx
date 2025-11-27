'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  // Rediriger vers tournaments par défaut
  useEffect(() => {
    if (userId) {
      router.replace(`/profile/${userId}/tournaments`)
    }
  }, [userId, router])

  return null
}

export default PublicProfilePage
