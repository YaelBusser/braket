'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './index.module.scss'
import SearchIcon from '../SearchIcon'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'dark' | 'light'
}

export default function SearchBar({ 
  placeholder = "Rechercher...", 
  onSearch,
  className = '',
  size = 'md',
  variant = 'dark'
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

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
        <button
          className={styles.searchButton}
          onClick={handleSearch}
          type="button"
        >
          <SearchIcon width={20} height={20} />
        </button>
      </div>
    </div>
  )
}
