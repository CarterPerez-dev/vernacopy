// ===================
// © AngelaMos | 2026
// clarity.editor.store.ts
// ===================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  CopyScanResponse,
  PhraseDetection,
  TokenResult,
} from '@/api/types/clarity.types'

type ActiveTab = 'lookup' | 'scanner' | 'compare'

interface ClarityEditorState {
  inputText: string
  tokens: TokenResult[]
  phrasesDetected: PhraseDetection[]
  overallScore: number | null
  totalWords: number
  contentWords: number
  tierDistribution: Record<string, number>
  scanId: string | null
  isScanning: boolean
  activeTab: ActiveTab
}

interface ClarityEditorActions {
  setInputText: (text: string) => void
  setScanResult: (response: CopyScanResponse) => void
  replaceWord: (position: number, endPosition: number, newWord: string) => void
  recalculateScore: () => void
  reset: () => void
  setActiveTab: (tab: ActiveTab) => void
}

type ClarityEditorStore = ClarityEditorState & ClarityEditorActions

const initialState: ClarityEditorState = {
  inputText: '',
  tokens: [],
  phrasesDetected: [],
  overallScore: null,
  totalWords: 0,
  contentWords: 0,
  tierDistribution: {},
  scanId: null,
  isScanning: false,
  activeTab: 'scanner',
}

const computeScore = (tokens: TokenResult[]): number | null => {
  const scoredTokens = tokens.filter(
    (t) => !t.is_stopword && !t.is_whitespace && t.score !== undefined
  )

  if (scoredTokens.length === 0) return null

  const total = scoredTokens.reduce((sum, t) => sum + (t.score ?? 0), 0)
  return Math.round((total / scoredTokens.length) * 100) / 100
}

export const useClarityEditorStore = create<ClarityEditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setInputText: (text) =>
        set({ inputText: text }, false, 'clarity/setInputText'),

      setScanResult: (response) =>
        set(
          {
            tokens: response.tokens,
            phrasesDetected: response.phrases_detected,
            overallScore: response.overall_score,
            totalWords: response.total_words,
            contentWords: response.content_words,
            tierDistribution: response.tier_distribution,
            scanId: response.scan_id,
            isScanning: false,
          },
          false,
          'clarity/setScanResult'
        ),

      replaceWord: (position, endPosition, newWord) => {
        const { tokens } = get()
        const updatedTokens = tokens.map((token) => {
          if (token.position === position && token.end_position === endPosition) {
            return { ...token, text: newWord }
          }
          return token
        })

        set({ tokens: updatedTokens }, false, 'clarity/replaceWord')
        get().recalculateScore()
      },

      recalculateScore: () => {
        const { tokens } = get()
        const newScore = computeScore(tokens)
        set({ overallScore: newScore }, false, 'clarity/recalculateScore')
      },

      reset: () => set({ ...initialState }, false, 'clarity/reset'),

      setActiveTab: (tab) =>
        set({ activeTab: tab }, false, 'clarity/setActiveTab'),
    }),
    { name: 'ClarityEditorStore' }
  )
)

export const useInputText = (): string =>
  useClarityEditorStore((s) => s.inputText)
export const useTokens = (): TokenResult[] =>
  useClarityEditorStore((s) => s.tokens)
export const useOverallScore = (): number | null =>
  useClarityEditorStore((s) => s.overallScore)
export const useIsScanning = (): boolean =>
  useClarityEditorStore((s) => s.isScanning)
export const useActiveTab = (): ActiveTab =>
  useClarityEditorStore((s) => s.activeTab)
export const useTierDistribution = (): Record<string, number> =>
  useClarityEditorStore((s) => s.tierDistribution)
export const usePhrasesDetected = (): PhraseDetection[] =>
  useClarityEditorStore((s) => s.phrasesDetected)
