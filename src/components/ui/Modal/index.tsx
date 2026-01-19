'use client'

import { ReactNode, useEffect, useState } from 'react'
import styles from './index.module.scss'

export interface ModalButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'cancel' | 'secondary'
  disabled?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode | ModalButton[]
  size?: 'small' | 'medium' | 'large'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: ModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Empêcher le scroll du body quand la modale est ouverte
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      handleClose()
    }
  }

  if (!isOpen && !isClosing) return null

  const renderFooter = () => {
    if (!footer) return null

    if (Array.isArray(footer)) {
      return (
        <div className={styles.modalFooter}>
          {footer.map((button, index) => (
            <button
              key={index}
              className={`${styles.modalButton} ${styles[`modalButton${button.variant === 'primary' ? 'Primary' : button.variant === 'danger' ? 'Danger' : button.variant === 'secondary' ? 'Secondary' : 'Cancel'}`]}`}
              onClick={button.onClick}
              disabled={button.disabled}
            >
              {button.label}
            </button>
          ))}
        </div>
      )
    }

    return <div className={styles.modalFooter}>{footer}</div>
  }

  return (
    <div 
      className={`${styles.modalOverlay} ${isClosing ? styles.modalOverlayClosing : ''}`} 
      onClick={handleOverlayClick}
    >
      <div 
        className={`${styles.modalContent} ${styles[`modalContent${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${isClosing ? styles.modalContentClosing : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button className={styles.closeButton} onClick={handleClose} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
        </div>

        <div className={styles.modalBody}>
          {children}
        </div>

        {footer && renderFooter()}
      </div>
    </div>
  )
}
