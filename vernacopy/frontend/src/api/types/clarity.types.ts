// ===================
// © AngelaMos | 2026
// clarity.types.ts
// ===================

import { z } from 'zod'

export const TIER_LABELS = {
  S: 'S-tier',
  A: 'A-tier',
  B: 'B-tier',
  C: 'C-tier',
  D: 'D-tier',
} as const

export type Tier = keyof typeof TIER_LABELS

export const dimensionBreakdownSchema = z.object({
  raw: z.number().nullable(),
  normalized: z.number().nullable(),
  score: z.number().nullable(),
})

export const scoreBreakdownSchema = z.object({
  frequency: dimensionBreakdownSchema,
  aoa: dimensionBreakdownSchema,
  concreteness: dimensionBreakdownSchema,
  familiarity: dimensionBreakdownSchema,
})

export const alternativeWordSchema = z.object({
  word: z.string(),
  clarity_score: z.number(),
  tier: z.string(),
})

export const wordDetailSchema = z.object({
  word: z.string(),
  clarity_score: z.number().nullable(),
  tier: z.string().nullable(),
  breakdown: scoreBreakdownSchema.nullable(),
  cefr_level: z.string().nullable(),
})

export const wordLookupResponseSchema = z.object({
  word: z.string(),
  clarity_score: z.number().nullable(),
  tier: z.string().nullable(),
  breakdown: scoreBreakdownSchema.nullable(),
  cefr_level: z.string().nullable(),
  alternatives: z.array(alternativeWordSchema),
  found: z.boolean(),
})

export const tokenResultSchema = z.object({
  text: z.string(),
  is_stopword: z.boolean().optional().default(false),
  is_whitespace: z.boolean().optional().default(false),
  position: z.number(),
  end_position: z.number(),
  score: z.number().nullish(),
  tier: z.string().nullish(),
  suggestions: z.array(alternativeWordSchema).nullish(),
})

export const phraseDetectionSchema = z.object({
  phrase: z.string(),
  position: z.number(),
  end_position: z.number(),
  replacement: z.string(),
  replacement_score: z.number().nullable(),
})

export const copyScanResponseSchema = z.object({
  overall_score: z.number().nullable(),
  total_words: z.number(),
  content_words: z.number(),
  tokens: z.array(tokenResultSchema),
  phrases_detected: z.array(phraseDetectionSchema),
  tier_distribution: z.record(z.string(), z.number()),
  scan_id: z.string().nullable(),
})

export const wordCompareResponseSchema = z.object({
  word_a: wordDetailSchema,
  word_b: wordDetailSchema,
  score_difference: z.number().nullable(),
  recommendation: z.string().nullable(),
})

export const scanHistoryItemSchema = z.object({
  id: z.string(),
  input_text_preview: z.string(),
  overall_score: z.number().nullable(),
  content_words: z.number(),
  created_at: z.string(),
})

export const scanHistoryListResponseSchema = z.object({
  items: z.array(scanHistoryItemSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export const scanHistoryDetailResponseSchema = copyScanResponseSchema.extend({
  id: z.string(),
  created_at: z.string(),
})

export const wordLookupRequestSchema = z.object({
  word: z.string(),
})

export const copyScanRequestSchema = z.object({
  text: z.string(),
})

export const wordCompareRequestSchema = z.object({
  word_a: z.string(),
  word_b: z.string(),
})

export type DimensionBreakdown = z.infer<typeof dimensionBreakdownSchema>
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>
export type AlternativeWord = z.infer<typeof alternativeWordSchema>
export type WordDetail = z.infer<typeof wordDetailSchema>
export type WordLookupResponse = z.infer<typeof wordLookupResponseSchema>
export type TokenResult = z.infer<typeof tokenResultSchema>
export type PhraseDetection = z.infer<typeof phraseDetectionSchema>
export type CopyScanResponse = z.infer<typeof copyScanResponseSchema>
export type WordCompareResponse = z.infer<typeof wordCompareResponseSchema>
export type ScanHistoryItem = z.infer<typeof scanHistoryItemSchema>
export type ScanHistoryListResponse = z.infer<
  typeof scanHistoryListResponseSchema
>
export type ScanHistoryDetailResponse = z.infer<
  typeof scanHistoryDetailResponseSchema
>
export type WordLookupRequest = z.infer<typeof wordLookupRequestSchema>
export type CopyScanRequest = z.infer<typeof copyScanRequestSchema>
export type WordCompareRequest = z.infer<typeof wordCompareRequestSchema>

export const isValidLookupResponse = (
  data: unknown
): data is WordLookupResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false

  const result = wordLookupResponseSchema.safeParse(data)
  return result.success
}

export const isValidScanResponse = (data: unknown): data is CopyScanResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false

  const result = copyScanResponseSchema.safeParse(data)
  return result.success
}

export const isValidCompareResponse = (
  data: unknown
): data is WordCompareResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false

  const result = wordCompareResponseSchema.safeParse(data)
  return result.success
}

export const isValidHistoryListResponse = (
  data: unknown
): data is ScanHistoryListResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false

  const result = scanHistoryListResponseSchema.safeParse(data)
  return result.success
}

export const isValidHistoryDetailResponse = (
  data: unknown
): data is ScanHistoryDetailResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false

  const result = scanHistoryDetailResponseSchema.safeParse(data)
  return result.success
}

export class ClarityResponseError extends Error {
  readonly endpoint?: string

  constructor(message: string, endpoint?: string) {
    super(message)
    this.name = 'ClarityResponseError'
    this.endpoint = endpoint
    Object.setPrototypeOf(this, ClarityResponseError.prototype)
  }
}

export const CLARITY_ERROR_MESSAGES = {
  INVALID_LOOKUP_RESPONSE: 'Invalid word lookup data from server',
  INVALID_SCAN_RESPONSE: 'Invalid scan data from server',
  INVALID_COMPARE_RESPONSE: 'Invalid compare data from server',
  INVALID_HISTORY_LIST_RESPONSE: 'Invalid history list from server',
  INVALID_HISTORY_DETAIL_RESPONSE: 'Invalid history detail from server',
  FAILED_TO_LOOKUP: 'Failed to look up word',
  FAILED_TO_SCAN: 'Failed to scan copy',
  FAILED_TO_COMPARE: 'Failed to compare words',
  FAILED_TO_DELETE_SCAN: 'Failed to delete scan',
} as const

export const CLARITY_SUCCESS_MESSAGES = {
  SCAN_COMPLETE: 'Scan complete',
  SCAN_DELETED: 'Scan deleted successfully',
} as const

export type ClarityErrorMessage =
  (typeof CLARITY_ERROR_MESSAGES)[keyof typeof CLARITY_ERROR_MESSAGES]
export type ClaritySuccessMessage =
  (typeof CLARITY_SUCCESS_MESSAGES)[keyof typeof CLARITY_SUCCESS_MESSAGES]
