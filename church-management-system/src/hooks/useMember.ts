import { useQuery } from '@tanstack/react-query'
import { getMember } from '../api/client'

export function useMember(memberId: string) {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: () => getMember(memberId),
    enabled: Boolean(memberId),
  })
}

