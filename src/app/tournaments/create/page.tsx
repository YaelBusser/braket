'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientPageWrapper from '../../../components/ClientPageWrapper'

export default function CreateTournamentPage() {
  return (
    <ClientPageWrapper>
      <CreateForm />
    </ClientPageWrapper>
  )
}

function CreateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    game: '',
    format: 'SINGLE_ELIMINATION',
    visibility: 'PUBLIC',
    category: 'VIDEO_GAMES',
    isTeamBased: 'solo',
    maxParticipants: '',
    kind: 'PERSONAL',
    teamMinSize: '',
    teamMaxSize: '',
    startDate: '',
    endDate: ''
  })
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState<Array<{ id: number; name: string; background_image?: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [selectedGameName, setSelectedGameName] = useState<string>('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGameInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGameQuery(value)
    // toute saisie manuelle invalide la sélection
    setSelectedGameId(null)
    setSelectedGameName('')
    if (value.trim().length < 2) {
      setGameResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      setGameResults(data.results || [])
    } catch {
      setGameResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handlePickGame = (name: string, id: number) => {
    setForm(prev => ({ ...prev, game: name }))
    setGameQuery(name)
    setSelectedGameId(id)
    setSelectedGameName(name)
    setGameResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.category === 'VIDEO_GAMES') {
      if (!selectedGameId || selectedGameName !== gameQuery) {
        alert('Veuillez choisir un jeu parmi les résultats de recherche')
        return
      }
    }
    setIsLoading(true)
    try {
      let res: Response
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.description) fd.append('description', form.description)
      if (form.category === 'VIDEO_GAMES') fd.append('game', selectedGameName)
      fd.append('format', form.format)
      fd.append('visibility', form.visibility)
      fd.append('category', form.category)
      fd.append('isTeamBased', String(form.isTeamBased === 'team'))
      if (form.maxParticipants) fd.append('maxParticipants', form.maxParticipants)
      fd.append('kind', form.kind)
      if (form.isTeamBased === 'team') {
        if (form.teamMinSize) fd.append('teamMinSize', form.teamMinSize)
        if (form.teamMaxSize) fd.append('teamMaxSize', form.teamMaxSize)
      }
      if (form.startDate) fd.append('startDate', form.startDate)
      if (form.endDate) fd.append('endDate', form.endDate)
      if (posterFile) fd.append('poster', posterFile)
      res = await fetch('/api/tournaments', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        if (res.status === 409) {
          alert('Vous avez déjà un tournoi en cours. Terminez-le ou supprimez-le avant d\'en créer un nouveau.')
          return
        }
        throw new Error(data.message || 'Erreur à la création')
      }
      const data = await res.json()
      router.push(`/tournaments/${data.tournament.id}`)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPosterFile(file)
    if (posterPreview) URL.revokeObjectURL(posterPreview)
    if (file) setPosterPreview(URL.createObjectURL(file))
    else setPosterPreview(null)
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="card">
        <div className="card-header">
          <h1>Créer un tournoi</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="name">Nom</label>
              <input className="form-input" id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea className="form-input" id="description" name="description" value={form.description} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ display: form.category === 'VIDEO_GAMES' ? 'block' : 'none' }}>
              <label className="form-label form-label-required" htmlFor="game">Jeu</label>
              <input
                className="form-input"
                id="game"
                name="game"
                value={gameQuery}
                onChange={handleGameInput}
                placeholder="Rechercher un jeu..."
                required
              />
              {(isSearching || gameResults.length > 0) && (
                <ul style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                  {isSearching && (
                    <li style={{ padding: 8, color: '#666' }}>Chargement...</li>
                  )}
                  {gameResults.map(g => (
                    <li key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, cursor: 'pointer' }} onClick={() => handlePickGame(g.name, g.id)}>
                      {g.background_image ? (
                        <img src={g.background_image} alt="" style={{ width: 40, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                      ) : null}
                      <span>{g.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {form.category === 'VIDEO_GAMES' && gameQuery && !selectedGameId && (
                <div className="text-muted" style={{ marginTop: 6, fontSize: 12 }}>
                  Veuillez sélectionner un jeu dans la liste.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">Catégorie</label>
              <select className="form-input" id="category" name="category" value={form.category} onChange={handleChange}>
                <option value="VIDEO_GAMES">Jeux vidéo</option>
                <option value="SPORTS">Sports</option>
                <option value="BOARD_GAMES">Jeux de société</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mode</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label><input type="radio" name="isTeamBased" value="solo" checked={form.isTeamBased === 'solo'} onChange={(e) => setForm(p => ({ ...p, isTeamBased: e.target.value }))} /> Solo</label>
                <label><input type="radio" name="isTeamBased" value="team" checked={form.isTeamBased === 'team'} onChange={(e) => setForm(p => ({ ...p, isTeamBased: e.target.value }))} /> Équipe</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maxParticipants">Nombre de participants</label>
              <input id="maxParticipants" name="maxParticipants" className="form-input" type="number" min="2" placeholder="ex: 16" value={form.maxParticipants} onChange={(e) => setForm(p => ({ ...p, maxParticipants: e.target.value }))} />
            </div>

            {form.isTeamBased === 'team' && (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="teamMinSize">Taille min. par équipe</label>
                  <input id="teamMinSize" className="form-input" type="number" min="1" value={form.teamMinSize} onChange={(e) => setForm(p => ({ ...p, teamMinSize: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="teamMaxSize">Taille max. par équipe</label>
                  <input id="teamMaxSize" className="form-input" type="number" min="1" value={form.teamMaxSize} onChange={(e) => setForm(p => ({ ...p, teamMaxSize: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="kind">Type de tournoi</label>
              <select id="kind" name="kind" className="form-input" value={form.kind} onChange={(e) => setForm(p => ({ ...p, kind: e.target.value }))}>
                <option value="PERSONAL">Particulier</option>
                <option value="PROFESSIONAL" disabled>Professionnel (bientôt)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="poster">Affiche du tournoi (PNG/JPG/WEBP)</label>
              <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePosterChange} className="form-input" />
              {posterPreview && (
                <div style={{ marginTop: 8 }}>
                  <img src={posterPreview} alt="Aperçu affiche" style={{ width: 240, height: 'auto', borderRadius: 8 }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="format">Format</label>
              <select className="form-input" id="format" name="format" value={form.format} onChange={handleChange}>
                <option value="SINGLE_ELIMINATION">Elimination directe</option>
                <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                <option value="ROUND_ROBIN" disabled>Round robin (bientôt)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="visibility">Visibilité</label>
              <select className="form-input" id="visibility" name="visibility" value={form.visibility} onChange={handleChange}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Privé</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startDate">Date de début</label>
              <input className="form-input" id="startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endDate">Date de fin</label>
              <input className="form-input" id="endDate" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}>Annuler</button>
              <button type="submit" className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`} disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


