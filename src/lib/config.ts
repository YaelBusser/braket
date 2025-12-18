export const UPLOADS_BASE_PATH = '/uploads/avatars'

export async function fetchCurrentUserProfile(): Promise<{
  user: { id: string; email: string; pseudo: string; avatarUrl: string | null }
}> {
  const res = await fetch('/api/profile', { method: 'GET' })
  if (!res.ok) {
    throw new Error('Impossible de récupérer le profil')
  }
  return res.json()
}


