/**
 * Formate une date en format relatif "Il y a X temps"
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Il y a moins d\'une minute'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    if (diffInDays === 1) {
      return 'Il y a 1 jour'
    }
    return `Il y a ${diffInDays} jours`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    if (diffInMonths === 1) {
      return 'Il y a 1 mois'
    }
    if (diffInMonths < 2) {
      return 'Il y a presque 2 mois'
    }
    return `Il y a ${diffInMonths} mois`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  if (diffInYears === 1) {
    return 'Il y a 1 an'
  }
  if (diffInYears < 2) {
    return 'Il y a presque 2 ans'
  }
  if (diffInYears === 2) {
    return 'Il y a plus de 2 ans'
  }
  if (diffInYears < 4) {
    return `Il y a presque ${diffInYears} ans`
  }
  
  return `Il y a ${diffInYears} ans`
}

/**
 * Formate une date en format relatif avec fuseau horaire
 */
export function formatRelativeTimeWithTZ(dateString: string | null | undefined): string {
  const relative = formatRelativeTime(dateString)
  if (!relative) return ''
  
  // Ajouter le fuseau horaire
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const tzOffset = new Date().getTimezoneOffset()
  const tzHours = Math.abs(Math.floor(tzOffset / 60))
  const tzMinutes = Math.abs(tzOffset % 60)
  const tzSign = tzOffset <= 0 ? '+' : '-'
  const tzString = `UTC${tzSign}${tzHours.toString().padStart(2, '0')}${tzMinutes.toString().padStart(2, '0')}`
  
  return `${relative} ${tzString}`
}

