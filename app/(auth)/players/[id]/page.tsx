import { Metadata } from 'next'
import Page from './player-detail'
import { Suspense } from 'react'
import dayjs from 'dayjs'
import { cookies } from 'next/headers';

const metadata: Metadata = {
  title: "Player Detail | LKRM",
  description: "Player Detail page",
}

type Props = {
  params: Promise<{ id: number }>
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

  return {
    title: 'Player',
    description: 'Player detail',
    openGraph: {
      title: 'Player',
      description: 'Player detail',
    },
  }
}

export default async function({ params }: Props) {
  const { id } = await params
  return (
    <Suspense>
      <Page playerId={id}/>
    </Suspense>
  )
}
