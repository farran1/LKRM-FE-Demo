'use client'

import React from 'react'

interface CenteredContentContainerProps {
  children: React.ReactNode
  sidebarCollapsed?: boolean
}

const CenteredContentContainer: React.FC<CenteredContentContainerProps> = ({ 
  children, 
  sidebarCollapsed = false 
}) => {
  // Calculate dynamic padding based on sidebar state
  const getContainerStyles = () => {
    if (sidebarCollapsed) {
      // When sidebar is collapsed, use more horizontal space
      return {
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }
    } else {
      // When sidebar is expanded, use less horizontal space
      return {
        paddingLeft: '16px',
        paddingRight: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }
    }
  }

  return (
    <div 
      style={{
        ...getContainerStyles(),
        transition: 'all 0.3s ease'
      }}
    >
      {children}
    </div>
  )
}

export default CenteredContentContainer
