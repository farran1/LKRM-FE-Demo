'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface DashboardRefreshContextType {
  refreshGamedayChecklist: () => void
  refreshCalendarEvents: () => void
  refreshRecentActivity: () => void
  refreshAll: () => void
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | null>(null)

export const useDashboardRefresh = () => {
  const context = useContext(DashboardRefreshContext)
  if (!context) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider')
  }
  return context
}

interface DashboardRefreshProviderProps {
  children: React.ReactNode
}

export function DashboardRefreshProvider({ children }: DashboardRefreshProviderProps) {
  const [refreshTriggers, setRefreshTriggers] = useState({
    gamedayChecklist: 0,
    calendarEvents: 0,
    recentActivity: 0
  })

  const refreshGamedayChecklist = useCallback(() => {
    setRefreshTriggers(prev => ({
      ...prev,
      gamedayChecklist: prev.gamedayChecklist + 1
    }))
  }, [])

  const refreshCalendarEvents = useCallback(() => {
    setRefreshTriggers(prev => ({
      ...prev,
      calendarEvents: prev.calendarEvents + 1
    }))
  }, [])

  const refreshRecentActivity = useCallback(() => {
    setRefreshTriggers(prev => ({
      ...prev,
      recentActivity: prev.recentActivity + 1
    }))
  }, [])

  const refreshAll = useCallback(() => {
    setRefreshTriggers(prev => ({
      gamedayChecklist: prev.gamedayChecklist + 1,
      calendarEvents: prev.calendarEvents + 1,
      recentActivity: prev.recentActivity + 1
    }))
  }, [])

  return (
    <DashboardRefreshContext.Provider value={{
      refreshGamedayChecklist,
      refreshCalendarEvents,
      refreshRecentActivity,
      refreshAll
    }}>
      {children}
    </DashboardRefreshContext.Provider>
  )
}
