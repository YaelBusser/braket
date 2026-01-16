'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './index.module.scss'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'dark' | 'light' | 'header'
  hideButton?: boolean
  autoSearchDelay?: number // ms; si fourni, déclenche une recherche en debounce
  redirectHomeOnEmpty?: boolean
  defaultValue?: string // Valeur initiale du champ de recherche
}

export default function SearchBar({ 
  placeholder = "Rechercher...", 
  onSearch,
  className = '',
  size = 'md',
  variant = 'dark',
  hideButton = false,
  autoSearchDelay,
  redirectHomeOnEmpty,
  defaultValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()
  const prevQueryRef = useRef('')
  
  // Synchroniser avec defaultValue si elle change
  useEffect(() => {
    if (defaultValue !== undefined) {
      setQuery(defaultValue)
    }
  }, [defaultValue])

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      if (onSearch) {
        onSearch(query.trim())
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Déclenchement auto (debounce) si demandé
  useEffect(() => {
    if (!autoSearchDelay) return
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        if (onSearch) {
          onSearch(query.trim())
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        }
      }
    }, autoSearchDelay)
    return () => clearTimeout(timer)
  }, [query, autoSearchDelay])

  // Redirection vers la home si on efface tout le champ
  useEffect(() => {
    const prev = prevQueryRef.current
    if (redirectHomeOnEmpty && prev.length > 0 && query.trim().length === 0) {
      router.push('/')
    }
    prevQueryRef.current = query
  }, [query, redirectHomeOnEmpty])

  return (
    <div className={`${styles.searchContainer} ${styles[`size-${size}`]} ${styles[`variant-${variant}`]} ${className}`}>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.searchIconWrapper}>
          {!hideButton ? (
            <button
              className={styles.searchButton}
              onClick={handleSearch}
              type="button"
              aria-label="Rechercher"
            >
              <img 
                src="/icons/search.svg" 
                alt="Rechercher" 
                className={styles.searchIcon}
              />
            </button>
          ) : (
            <img 
              src="/icons/search.svg" 
              alt="Rechercher" 
              className={styles.searchIcon}
            />
          )}
        </div>
      </div>
    </div>
  )
}
