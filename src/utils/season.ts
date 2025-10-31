/**
 * Get the current basketball season based on the current date
 * Basketball seasons typically start in November and run through March/April
 * Format: "YYYY-YY" (e.g., "2024-25")
 * 
 * For "starting season" context: If we're in October or later, we're preparing/starting the new season
 */
export function getCurrentSeason(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  // If we're in October or later, we're preparing for or in the season starting this year (Nov)
  // If we're in January through September, we're in the season that started last November
  if (currentMonth >= 10) {
    // October, November, or December - we're preparing for or in the season starting this November
    const nextYear = (currentYear + 1).toString().slice(-2)
    return `${currentYear}-${nextYear}`
  } else {
    // January through September - we're in the season that started last November
    const lastYear = currentYear - 1
    const thisYearStr = currentYear.toString().slice(-2)
    return `${lastYear}-${thisYearStr}`
  }
}

/**
 * Get the next basketball season
 */
export function getNextSeason(): string {
  const current = getCurrentSeason()
  const [startYear] = current.split('-')
  const nextStartYear = parseInt(startYear) + 1
  const nextEndYear = (nextStartYear + 1).toString().slice(-2)
  return `${nextStartYear}-${nextEndYear}`
}

