// ===================
// © AngelaMos | 2026
// useClarity.ts
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CLARITY_ERROR_MESSAGES,
  CLARITY_SUCCESS_MESSAGES,
  ClarityResponseError,
  type CopyScanRequest,
  type CopyScanResponse,
  isValidCompareResponse,
  isValidHistoryDetailResponse,
  isValidHistoryListResponse,
  isValidLookupResponse,
  isValidScanResponse,
  type ScanHistoryDetailResponse,
  type ScanHistoryListResponse,
  type WordCompareRequest,
  type WordCompareResponse,
  type WordLookupRequest,
  type WordLookupResponse,
} from '@/api/types'
import { API_ENDPOINTS, PAGINATION, QUERY_KEYS } from '@/config'
import { apiClient, QUERY_STRATEGIES } from '@/core/api'

export const clarityQueries = {
  all: () => QUERY_KEYS.CLARITY.ALL,
  history: {
    all: () => QUERY_KEYS.CLARITY.HISTORY.ALL,
    list: (page: number, size: number) =>
      QUERY_KEYS.CLARITY.HISTORY.LIST({ page, size }),
    detail: (id: string) => QUERY_KEYS.CLARITY.HISTORY.DETAIL(id),
  },
} as const

const performWordLookup = async (
  data: WordLookupRequest
): Promise<WordLookupResponse> => {
  const response = await apiClient.post<unknown>(
    API_ENDPOINTS.CLARITY.LOOKUP,
    data
  )
  const responseData: unknown = response.data

  if (!isValidLookupResponse(responseData)) {
    throw new ClarityResponseError(
      CLARITY_ERROR_MESSAGES.INVALID_LOOKUP_RESPONSE,
      API_ENDPOINTS.CLARITY.LOOKUP
    )
  }

  return responseData
}

export const useWordLookup = (): UseMutationResult<
  WordLookupResponse,
  Error,
  WordLookupRequest
> => {
  return useMutation({
    mutationFn: performWordLookup,
    onError: (error: Error): void => {
      const message =
        error instanceof ClarityResponseError
          ? error.message
          : CLARITY_ERROR_MESSAGES.FAILED_TO_LOOKUP
      toast.error(message)
    },
  })
}

const performCopyScan = async (
  data: CopyScanRequest
): Promise<CopyScanResponse> => {
  const response = await apiClient.post<unknown>(API_ENDPOINTS.CLARITY.SCAN, data)
  const responseData: unknown = response.data

  if (!isValidScanResponse(responseData)) {
    throw new ClarityResponseError(
      CLARITY_ERROR_MESSAGES.INVALID_SCAN_RESPONSE,
      API_ENDPOINTS.CLARITY.SCAN
    )
  }

  return responseData
}

export const useCopyScan = (): UseMutationResult<
  CopyScanResponse,
  Error,
  CopyScanRequest
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: performCopyScan,
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: clarityQueries.history.all(),
      })

      toast.success(CLARITY_SUCCESS_MESSAGES.SCAN_COMPLETE)
    },
    onError: (error: Error): void => {
      const message =
        error instanceof ClarityResponseError
          ? error.message
          : CLARITY_ERROR_MESSAGES.FAILED_TO_SCAN
      toast.error(message)
    },
  })
}

const performWordCompare = async (
  data: WordCompareRequest
): Promise<WordCompareResponse> => {
  const response = await apiClient.post<unknown>(
    API_ENDPOINTS.CLARITY.COMPARE,
    data
  )
  const responseData: unknown = response.data

  if (!isValidCompareResponse(responseData)) {
    throw new ClarityResponseError(
      CLARITY_ERROR_MESSAGES.INVALID_COMPARE_RESPONSE,
      API_ENDPOINTS.CLARITY.COMPARE
    )
  }

  return responseData
}

export const useWordCompare = (): UseMutationResult<
  WordCompareResponse,
  Error,
  WordCompareRequest
> => {
  return useMutation({
    mutationFn: performWordCompare,
    onError: (error: Error): void => {
      const message =
        error instanceof ClarityResponseError
          ? error.message
          : CLARITY_ERROR_MESSAGES.FAILED_TO_COMPARE
      toast.error(message)
    },
  })
}

interface UseScanHistoryParams {
  page?: number
  size?: number
}

const fetchScanHistory = async (
  page: number,
  size: number
): Promise<ScanHistoryListResponse> => {
  const response = await apiClient.get<unknown>(
    API_ENDPOINTS.CLARITY.HISTORY.LIST,
    { params: { page, size } }
  )
  const data: unknown = response.data

  if (!isValidHistoryListResponse(data)) {
    throw new ClarityResponseError(
      CLARITY_ERROR_MESSAGES.INVALID_HISTORY_LIST_RESPONSE,
      API_ENDPOINTS.CLARITY.HISTORY.LIST
    )
  }

  return data
}

export const useScanHistory = (
  params: UseScanHistoryParams = {}
): UseQueryResult<ScanHistoryListResponse, Error> => {
  const page = params.page ?? PAGINATION.DEFAULT_PAGE
  const size = params.size ?? PAGINATION.DEFAULT_SIZE

  return useQuery({
    queryKey: clarityQueries.history.list(page, size),
    queryFn: () => fetchScanHistory(page, size),
    ...QUERY_STRATEGIES.standard,
  })
}

const fetchScanDetail = async (
  id: string
): Promise<ScanHistoryDetailResponse> => {
  const response = await apiClient.get<unknown>(
    API_ENDPOINTS.CLARITY.HISTORY.BY_ID(id)
  )
  const data: unknown = response.data

  if (!isValidHistoryDetailResponse(data)) {
    throw new ClarityResponseError(
      CLARITY_ERROR_MESSAGES.INVALID_HISTORY_DETAIL_RESPONSE,
      API_ENDPOINTS.CLARITY.HISTORY.BY_ID(id)
    )
  }

  return data
}

export const useScanDetail = (
  id: string | null
): UseQueryResult<ScanHistoryDetailResponse, Error> => {
  return useQuery({
    queryKey: clarityQueries.history.detail(id ?? ''),
    queryFn: () => fetchScanDetail(id ?? ''),
    enabled: id !== null && id.length > 0,
    ...QUERY_STRATEGIES.standard,
  })
}

const performDeleteScan = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.CLARITY.HISTORY.DELETE(id))
}

export const useDeleteScan = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: performDeleteScan,
    onSuccess: async (_, id: string): Promise<void> => {
      queryClient.removeQueries({
        queryKey: clarityQueries.history.detail(id),
      })

      await queryClient.invalidateQueries({
        queryKey: clarityQueries.history.all(),
      })

      toast.success(CLARITY_SUCCESS_MESSAGES.SCAN_DELETED)
    },
    onError: (error: Error): void => {
      const message =
        error instanceof ClarityResponseError
          ? error.message
          : CLARITY_ERROR_MESSAGES.FAILED_TO_DELETE_SCAN
      toast.error(message)
    },
  })
}
