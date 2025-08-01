import { ROUTES } from '@/utils/routes'
import Link from 'next/link'
import CalendarIcon from '@/components/icon/calendar.svg'
import ChartIcon from '@/components/icon/chart.svg'
import HandIcon from '@/components/icon/hand.svg'
import UserIcon from '@/components/icon/users-round.svg'
import ListIcon from '@/components/icon/list-check.svg'
import CreditIcon from '@/components/icon/credit-card.svg'
import BankIcon from '@/components/icon/banknotes.svg'
import LockerIcon from '@/components/icon/locker.svg'

// Dashboard icon component - grid layout style
const DashboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Play button icon component for Live Stat Tracker
const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <polygon points="10,8 16,12 10,16" fill="currentColor"/>
  </svg>
)

// Debug: Check if all routes are defined
console.log('ROUTES:', ROUTES)
console.log('ROUTES.statistic:', ROUTES.statistic)
console.log('ROUTES.statsDash:', ROUTES.statsDash)
console.log('ROUTES.planner.event:', ROUTES.planner.event)
console.log('ROUTES.planner.volunteer:', ROUTES.planner.volunteer)
console.log('ROUTES.team.player:', ROUTES.team.player)
console.log('ROUTES.team.task:', ROUTES.team.task)
console.log('ROUTES.finance.budget:', ROUTES.finance.budget)
console.log('ROUTES.finance.expense:', ROUTES.finance.expense)

export const menus = [
  {
    key: 'overview', 
    icon: null, 
    children: [
      { 
        key: '/dashboard',
        label: <Link href="/dashboard">Dashboard</Link>,
        icon: <LockerIcon />,
      },
    ],
  },
  {
    key: 'statistics',  
    icon: null,
    label: 'Performance',
    children: [
      { key: '/stats-dashboard', icon: <ChartIcon />, label: <Link href="/stats-dashboard">Statistics</Link> },
      { key: '/live-stat-tracker', icon: <PlayIcon />, label: <Link href="/live-stat-tracker">Live Stat Tracker</Link> },
    ],
  },
  {
    key: 'planner', icon: null, label: 'Planner',
    children: [
      { key: '/events', icon: <CalendarIcon />, label: <Link href="/events">Events</Link> },
    ],
  },
  {
    key: 'team', icon: null, label: 'Team Management',
    children: [
      { key: '/players', icon: <UserIcon />, label: <Link href="/players">Players</Link> },
      { key: '/tasks', icon: <ListIcon />, label: <Link href="/tasks">Tasks</Link> },
    ],
  },
  {
    key: 'finance', icon: null, label: 'Finance',
    children: [
      { key: '/budgets', icon: <BankIcon />, label: <Link href="/budgets">Budgets</Link> },
      { key: '/expenses', icon: <CreditIcon />, label: <Link href="/expenses">Expenses</Link> },
    ],
  }
]