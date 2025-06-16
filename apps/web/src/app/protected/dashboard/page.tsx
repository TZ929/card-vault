'use client'

import { useAuth } from '@clerk/nextjs'

export default function Dashboard() {
  const { userId, isSignedIn } = useAuth()

  if (!isSignedIn) return null // or redirect

  return <main className="p-4">Welcome, user {userId}</main>
}
