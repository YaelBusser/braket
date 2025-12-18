import React from 'react'

interface VisualsIconProps {
  width?: number | string
  height?: number | string
  className?: string
  fill?: string
}

export default function VisualsIcon({ 
  width = 24, 
  height = 24, 
  className = '',
  fill
}: VisualsIconProps) {
  // Si fill n'est pas fourni, utiliser currentColor pour hériter de la couleur du texte
  const fillColor = fill || 'currentColor'
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        fill={fillColor}
        stroke={"none"}
        d="M21 21.75h-5a.75.75 0 0 1 0-1.5h5a.75.75 0 0 1 0 1.5ZM3.44 12.56a1.491 1.491 0 0 0 0 2.12l.91.91 2.12-2.12a.75.75 0 0 1 1.06 1.06l-2.12 2.12 3.91 3.91a1.491 1.491 0 0 0 2.12 0l3.95-3.94-8-8Zm5.57-6.571L8.3 6.7a.5.5 0 0 0 0 .707l8.289 8.293a.5.5 0 0 0 .707 0l.714-.714a2 2 0 0 0 .443-2.157l-1.1-2.743a1.5 1.5 0 0 1 .456-1.728l2.474-1.98a1.9 1.9 0 0 0 .157-2.825 1.9 1.9 0 0 0-2.825.157l-1.98 2.474a1.5 1.5 0 0 1-1.728.456l-2.743-1.1a2 2 0 0 0-2.154.449Z"
      />
    </svg>
  )
}

