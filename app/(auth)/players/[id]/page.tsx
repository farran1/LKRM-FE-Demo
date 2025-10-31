import { Metadata } from 'next'
import Page from './player-detail'
import { Suspense } from 'react'
import dayjs from 'dayjs'

const metadata: Metadata = {
  title: "Player Detail | LKRM",
  description: "Player Detail page",
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate static params for static export
export async function generateStaticParams() {
  // For demo purposes, generate a few common player IDs
  // In a real app, you'd fetch this from your API
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ]
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params
  
  try {
    // Fetch player data for the title
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL
    if (!apiUrl) {
      console.error('API URL not configured')
      return {
        title: 'Player | LKRM',
        description: 'Player profile',
      }
    }
    const response = await fetch(`${apiUrl}/api/players/${id}`)
    if (response.ok) {
      const data = await response.json()
      const player = data.player
      const playerName = player?.first_name && player?.last_name 
        ? `${player.first_name} ${player.last_name}`
        : player?.name || 'Player'
      
      return {
        title: `${playerName} | LKRM`,
        description: `Player profile for ${playerName}`,
        openGraph: {
          title: `${playerName} | LKRM`,
          description: `Player profile for ${playerName}`,
        },
      }
    }
  } catch (error) {
    console.error('Error fetching player for metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Player | LKRM',
    description: 'Player profile',
    openGraph: {
      title: 'Player | LKRM',
      description: 'Player profile',
    },
  }
}

export default async function({ params }: Props) {
  const { id } = await params
  return (
    <Suspense>
      <Page playerId={parseInt(id as string)}/>
    </Suspense>
  )
}
