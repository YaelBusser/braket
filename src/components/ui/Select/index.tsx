import React from 'react'
import styles from './index.module.scss'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  help?: string
  success?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
}

export default function Select({
  label,
  error,
  help,
  success,
  required = false,
  options,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  const selectClasses = [
    styles.select,
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
      <select
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className={styles.errorText}>{error}</div>}
      {help && <div className={styles.helpText}>{help}</div>}
      {success && <div className={styles.successText}>{success}</div>}
    </div>
  )
}
