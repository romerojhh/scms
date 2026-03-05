import { useQuery } from '@tanstack/react-query'
import { getMembers } from '../api/client'
import type { ListMembersParams } from '../types/api'

export function useMembers(params: ListMembersParams) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => getMembers(params),
  })
}

