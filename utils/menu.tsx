import { ROUTES } from '@/utils/routes'
import Link from 'next/link'
import CalendarIcon from '@/components/icon/calendar.svg'
import ChartIcon from '@/components/icon/chart.svg'
import HandIcon from '@/components/icon/hand.svg'
import UserIcon from '@/components/icon/users-round.svg'
import ListIcon from '@/components/icon/list-check.svg'
import CreditIcon from '@/components/icon/credit-card.svg'
import BankIcon from '@/components/icon/banknotes.svg'

export const menus = [
  { key: ROUTES.statistic, icon: <ChartIcon />, label: <Link href={ROUTES.statistic}>Statistics</Link> },
  {
    key: 'planner', icon: null, label: 'Planner',
    children: [
      { key: ROUTES.planner.event, icon: <CalendarIcon />, label: <Link href={ROUTES.planner.event}>Events</Link> },
      { key: ROUTES.planner.volunteer, icon: <HandIcon />, label: <Link href={ROUTES.planner.volunteer}>Volunteers</Link> },
    ],
  },
  {
    key: 'team', icon: null, label: 'Team Management',
    children: [
      { key: ROUTES.team.player, icon: <UserIcon />, label: <Link href={ROUTES.team.player}>Players</Link> },
      { key: ROUTES.team.task, icon: <ListIcon />, label: <Link href={ROUTES.team.task}>Tasks</Link> },
    ],
  },
  {
    key: 'finance', icon: null, label: 'Finance',
    children: [
      { key: ROUTES.finance.budget, icon: <CreditIcon />, label: <Link href={ROUTES.finance.budget}>Budgets</Link> },
      { key: ROUTES.finance.expense, icon: <BankIcon />, label: <Link href={ROUTES.finance.expense}>Expenses</Link> },
    ],
  }
]