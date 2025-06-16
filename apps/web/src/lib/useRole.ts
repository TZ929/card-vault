import { useUser } from '@clerk/nextjs'
export const useRole = () => useUser().user?.publicMetadata.role as
  | 'BUYER'
  | 'SELLER'
  | 'PARTNER'
  | 'ADMIN'
