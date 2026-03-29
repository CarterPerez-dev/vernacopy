// ===================
// © AngelaMos | 2026
// word-compare.tsx
// ===================

import { useState } from 'react'
import { useWordCompare } from '@/api/hooks'
import { ScoreBreakdownChart } from './score-breakdown'
import { TierBadge } from './tier-badge'
import styles from './word-compare.module.scss'

export function WordCompare(): React.ReactElement {
  const [wordA, setWordA] = useState('')
  const [wordB, setWordB] = useState('')
  const compare = useWordCompare()

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const trimmedA = wordA.trim()
    const trimmedB = wordB.trim()
    if (trimmedA.length === 0 || trimmedB.length === 0) return
    compare.mutate({ word_a: trimmedA, word_b: trimmedB })
  }

  const data = compare.data
  const winnerIsA =
    data !== undefined && data.word_a.clarity_score >= data.word_b.clarity_score

  return (
    <div className={styles.compare}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrap}>
          <label htmlFor="wordA" className={styles.inputLabel}>
            WORD A
          </label>
          <input
            id="wordA"
            type="text"
            placeholder="First word..."
            value={wordA}
            onChange={(e) => setWordA(e.target.value)}
            className={styles.input}
          />
        </div>
        <span className={styles.vsLabel}>VS</span>
        <div className={styles.inputWrap}>
          <label htmlFor="wordB" className={styles.inputLabel}>
            WORD B
          </label>
          <input
            id="wordB"
            type="text"
            placeholder="Second word..."
            value={wordB}
            onChange={(e) => setWordB(e.target.value)}
            className={styles.input}
          />
        </div>
        <button
          type="submit"
          disabled={
            compare.isPending ||
            wordA.trim().length === 0 ||
            wordB.trim().length === 0
          }
          className={styles.submitBtn}
        >
          {compare.isPending ? 'COMPARING...' : 'COMPARE'}
        </button>
      </form>

      {compare.isPending && (
        <div className={styles.loadingState}>
          <span className={styles.loadingText}>COMPARING WORDS...</span>
        </div>
      )}

      {data !== undefined && !compare.isPending && (
        <div className={styles.results}>
          <div className={styles.wordGrid}>
            <div
              className={`${styles.wordCard} ${winnerIsA ? styles.winner : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>WORD A</span>
                {winnerIsA && <span className={styles.winnerTag}>CLEARER</span>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardScore}>
                  <span className={styles.scoreValue}>
                    {Math.round(data.word_a.clarity_score)}
                  </span>
                  <TierBadge tier={data.word_a.tier} size="md" />
                </div>
                <span className={styles.cardWord}>{data.word_a.word}</span>
                {data.word_a.cefr_level !== null && (
                  <span className={styles.cefrLabel}>
                    CEFR {data.word_a.cefr_level}
                  </span>
                )}
                <ScoreBreakdownChart breakdown={data.word_a.breakdown} />
              </div>
            </div>

            <div
              className={`${styles.wordCard} ${!winnerIsA ? styles.winner : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>WORD B</span>
                {!winnerIsA && <span className={styles.winnerTag}>CLEARER</span>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardScore}>
                  <span className={styles.scoreValue}>
                    {Math.round(data.word_b.clarity_score)}
                  </span>
                  <TierBadge tier={data.word_b.tier} size="md" />
                </div>
                <span className={styles.cardWord}>{data.word_b.word}</span>
                {data.word_b.cefr_level !== null && (
                  <span className={styles.cefrLabel}>
                    CEFR {data.word_b.cefr_level}
                  </span>
                )}
                <ScoreBreakdownChart breakdown={data.word_b.breakdown} />
              </div>
            </div>
          </div>

          <div className={styles.verdict}>
            <span className={styles.verdictArrow}>
              {winnerIsA ? '\u2190' : '\u2192'}
            </span>
            <div className={styles.verdictContent}>
              <span className={styles.verdictText}>{data.recommendation}</span>
              <span className={styles.verdictDelta}>
                &Delta; {Math.round(data.score_difference)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
