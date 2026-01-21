'use client'

import { ReactNode } from 'react'
import SearchBar from '../SearchBar'
import styles from './index.module.scss'

interface SearchBarWrapperProps {
  placeholder?: string
  onSearch?: (query: string) => void
  autoSearchDelay?: number
  defaultValue?: string
  children?: ReactNode // Pour les filtres optionnels à droite
}

export default function SearchBarWrapper({
  placeholder = "Rechercher...",
  onSearch,
  autoSearchDelay = 300,
  defaultValue = '',
  children
}: SearchBarWrapperProps) {
  return (
    <div className={styles.searchSection}>
      <div className={styles.searchBarWrapper}>
        <SearchBar
          placeholder={placeholder}
          size="md"
          variant="dark"
          onSearch={onSearch}
          autoSearchDelay={autoSearchDelay}
          defaultValue={defaultValue}
        />
      </div>
      
      {children && (
        <div className={styles.filtersWrapper}>
          {children}
        </div>
      )}
    </div>
  )
}
