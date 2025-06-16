'use client'

import { useAuth } from '@clerk/nextjs'

export default function List() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) return null

  return <div>Card listings coming soon...</div>
}
