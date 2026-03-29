// ===================
// © AngelaMos | 2026
// copy-scanner.tsx
// ===================

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useCopyScan } from '@/api/hooks'
import { useClarityEditorStore } from '@/core/lib'
import styles from './copy-scanner.module.scss'
import { HighlightedText } from './highlighted-text'
import { TierBadge } from './tier-badge'

function getTierForScore(score: number): string {
  if (score >= 80) return 'S'
  if (score >= 60) return 'A'
  if (score >= 40) return 'B'
  if (score >= 20) return 'C'
  return 'D'
}

export function CopyScanner(): React.ReactElement {
  const {
    inputText,
    setInputText,
    tokens,
    overallScore,
    tierDistribution,
    phrasesDetected,
    setScanResult,
    replaceWord,
    reset,
  } = useClarityEditorStore()

  const scanMutation = useCopyScan()

  const isResultMode = tokens.length > 0

  const handleScan = useCallback(() => {
    const trimmed = inputText.trim()
    if (trimmed.length === 0) return
    scanMutation.mutate(
      { text: trimmed },
      {
        onSuccess: (data) => {
          setScanResult(data)
        },
      }
    )
  }, [inputText, scanMutation, setScanResult])

  const handleRescan = useCallback(() => {
    const currentText = tokens.map((t) => t.text).join('')
    if (currentText.trim().length === 0) return
    scanMutation.mutate(
      { text: currentText },
      {
        onSuccess: (data) => {
          setScanResult(data)
        },
      }
    )
  }, [tokens, scanMutation, setScanResult])

  const handleCopyText = useCallback(() => {
    const text = tokens.map((t) => t.text).join('')
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard')
    })
  }, [tokens])

  const handleStartOver = useCallback(() => {
    reset()
  }, [reset])

  const handleReplace = useCallback(
    (position: number, endPosition: number, newWord: string) => {
      replaceWord(position, endPosition, newWord)
    },
    [replaceWord]
  )

  if (!isResultMode) {
    return (
      <div className={styles.scanner}>
        <div className={styles.editorWrap}>
          <div className={styles.editorHeader}>
            <span className={styles.editorLabel}>INPUT</span>
          </div>
          <textarea
            placeholder="Paste or type your copy here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={styles.textarea}
          />
        </div>
        <div className={styles.editorActions}>
          <button
            type="button"
            onClick={handleScan}
            disabled={scanMutation.isPending || inputText.trim().length === 0}
            className={styles.scanBtn}
          >
            {scanMutation.isPending ? 'SCANNING...' : 'SCAN'}
          </button>
        </div>
        {scanMutation.isPending && (
          <div className={styles.loadingState}>
            <span className={styles.loadingText}>ANALYZING YOUR COPY...</span>
          </div>
        )}
      </div>
    )
  }

  const overallTier = overallScore !== null ? getTierForScore(overallScore) : 'B'
  const tierEntries = Object.entries(tierDistribution).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <div className={styles.scanner}>
      <div className={styles.statsBar}>
        <div className={styles.overallScore}>
          <span className={styles.scoreValue}>
            {overallScore !== null ? Math.round(overallScore) : '\u2014'}
          </span>
          <TierBadge tier={overallTier} size="md" />
          <span className={styles.scoreLabel}>OVERALL CLARITY</span>
        </div>
        <div className={styles.tierDist}>
          {tierEntries.map(([tier, count]) => (
            <span key={tier} className={styles.tierCount}>
              <TierBadge tier={tier} size="sm" />
              <span className={styles.tierCountNum}>{count}</span>
            </span>
          ))}
        </div>
      </div>

      <HighlightedText tokens={tokens} onReplace={handleReplace} />

      {phrasesDetected.length > 0 && (
        <div className={styles.phrases}>
          <div className={styles.phrasesHeader}>
            <span className={styles.phrasesLabel}>PHRASE SUGGESTIONS</span>
          </div>
          <div className={styles.phraseList}>
            {phrasesDetected.map((phrase) => (
              <div key={phrase.position} className={styles.phraseRow}>
                <span className={styles.phraseOriginal}>{phrase.phrase}</span>
                <span className={styles.phraseArrow}>&rarr;</span>
                <span className={styles.phraseReplacement}>
                  {phrase.replacement}
                </span>
                {phrase.replacement_score != null && (
                  <span className={styles.phraseScore}>
                    {Math.round(phrase.replacement_score)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.resultActions}>
        <button
          type="button"
          onClick={handleCopyText}
          className={styles.actionBtn}
        >
          COPY TEXT
        </button>
        <button
          type="button"
          onClick={handleRescan}
          disabled={scanMutation.isPending}
          className={styles.actionBtn}
        >
          {scanMutation.isPending ? 'SCANNING...' : 'RE-SCAN'}
        </button>
        <button
          type="button"
          onClick={handleStartOver}
          className={styles.actionBtnAlt}
        >
          START OVER
        </button>
      </div>
    </div>
  )
}
