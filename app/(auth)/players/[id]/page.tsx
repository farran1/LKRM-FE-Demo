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
