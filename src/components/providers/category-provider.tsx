'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Category = 'VIDEO_GAMES' | 'SPORTS' | 'BOARD_GAMES'

type CategoryContextValue = {
  category: Category
  setCategory: (c: Category) => void
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined)

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategoryState] = useState<Category>('VIDEO_GAMES')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lt_category') as Category | null
      if (stored) setCategoryState(stored)
    } catch {}
  }, [])

  useEffect(() => {
    // écouter les changements d'autres onglets
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lt_category' && e.newValue) {
        setCategoryState(e.newValue as Category)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setCategory = (c: Category) => {
    setCategoryState(c)
    try { localStorage.setItem('lt_category', c) } catch {}
    // notifier les listeners dans la même page
    window.dispatchEvent(new StorageEvent('storage', { key: 'lt_category', newValue: c }))
  }

  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error('useCategory must be used within CategoryProvider')
  return ctx
}
