import { useQuery } from '@tanstack/react-query'
import { getFinanceByMonth } from '../api/client'
import type { FinanceByMonthParams } from '../types/api'

export function useFinanceByMonth(params: FinanceByMonthParams) {
  return useQuery({
    queryKey: ['finance', params],
    queryFn: () => getFinanceByMonth(params),
  })
}

