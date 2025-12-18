'use client'

import { ReactNode } from 'react'
import styles from './index.module.scss'

export interface Tab {
  key: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
  children?: ReactNode
  className?: string
}

export default function Tabs({ tabs, activeTab, onTabChange, children, className = '' }: TabsProps) {
  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        {children}
      </div>
    </div>
  )
}

