import React from 'react'
import styles from './index.module.scss'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  help?: string
  success?: string
  required?: boolean
}

export default function Input({
  label,
  error,
  help,
  success,
  required = false,
  className = '',
  ...props
}: InputProps) {
  const inputClasses = [
    styles.input,
    error && styles.error,
    success && styles.success,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.formGroup}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && <div className={styles.errorText}>{error}</div>}
      {help && <div className={styles.helpText}>{help}</div>}
      {success && <div className={styles.successText}>{success}</div>}
    </div>
  )
}
