// ===================
// © AngelaMos | 2026
// word-lookup.tsx
// ===================

import { useState } from 'react'
import { useWordLookup } from '@/api/hooks'
import { ScoreBreakdownChart } from './score-breakdown'
import { TierBadge } from './tier-badge'
import styles from './word-lookup.module.scss'

export function WordLookup(): React.ReactElement {
  const [word, setWord] = useState('')
  const lookup = useWordLookup()

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const trimmed = word.trim()
    if (trimmed.length === 0) return
    lookup.mutate({ word: trimmed })
  }

  return (
    <div className={styles.lookup}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrap}>
          <label htmlFor="wordInput" className={styles.inputLabel}>
            ENTER WORD
          </label>
          <input
            id="wordInput"
            type="text"
            placeholder="Enter a word..."
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className={styles.input}
          />
        </div>
        <button
          type="submit"
          disabled={lookup.isPending || word.trim().length === 0}
          className={styles.submitBtn}
        >
          {lookup.isPending ? 'ANALYZING...' : 'LOOKUP'}
        </button>
      </form>

      {lookup.isPending && (
        <div className={styles.loadingState}>
          <span className={styles.loadingText}>ANALYZING WORD...</span>
        </div>
      )}

      {lookup.data !== undefined &&
        !lookup.isPending &&
        (lookup.data.found ? (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreValue}>
                  {Math.round(lookup.data.clarity_score)}
                </span>
                <TierBadge tier={lookup.data.tier} size="md" />
              </div>
              <div className={styles.wordInfo}>
                <span className={styles.wordText}>{lookup.data.word}</span>
                {lookup.data.cefr_level !== null && (
                  <span className={styles.cefrLabel}>
                    CEFR {lookup.data.cefr_level}
                  </span>
                )}
              </div>
            </div>

            <ScoreBreakdownChart breakdown={lookup.data.breakdown} />

            {lookup.data.alternatives.length > 0 && (
              <div className={styles.alternatives}>
                <div className={styles.altHeader}>
                  <span className={styles.altLabel}>CLEARER ALTERNATIVES</span>
                </div>
                <div className={styles.altList}>
                  {lookup.data.alternatives.map((alt) => (
                    <div key={alt.word} className={styles.altRow}>
                      <span className={styles.altWord}>{alt.word}</span>
                      <span className={styles.altScore}>
                        {Math.round(alt.clarity_score)}
                      </span>
                      <TierBadge tier={alt.tier} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.notFound}>
            <span className={styles.notFoundTitle}>WORD NOT FOUND</span>
            <span className={styles.notFoundDesc}>
              &ldquo;{lookup.data.word}&rdquo; is not in the clarity database
            </span>
          </div>
        ))}
    </div>
  )
}
