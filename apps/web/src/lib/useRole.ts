import { useUser } from '@clerk/nextjs'
import { Role } from 'db'

export function useRole(role: Role) {
  const { user } = useUser()

  if (!user) {
    return false
  }

  return user.publicMetadata?.role === role
}
