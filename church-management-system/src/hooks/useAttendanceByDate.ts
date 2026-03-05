import { useQuery } from '@tanstack/react-query'
import { getAttendanceByDate } from '../api/client'
import type { AttendanceByDateParams } from '../types/api'

export function useAttendanceByDate(params: AttendanceByDateParams) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => getAttendanceByDate(params),
  })
}

