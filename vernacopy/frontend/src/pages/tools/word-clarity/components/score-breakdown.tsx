// ===================
// © AngelaMos | 2026
// score-breakdown.tsx
// ===================

import type { ScoreBreakdown } from '@/api/types'
import styles from './score-breakdown.module.scss'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown
}

const DIMENSIONS = [
  { key: 'frequency' as const, label: 'FREQUENCY', abbr: 'FRQ' },
  { key: 'aoa' as const, label: 'AGE OF ACQUISITION', abbr: 'AOA' },
  { key: 'concreteness' as const, label: 'CONCRETENESS', abbr: 'CON' },
  { key: 'familiarity' as const, label: 'FAMILIARITY', abbr: 'FAM' },
]

export function ScoreBreakdownChart({
  breakdown,
}: ScoreBreakdownProps): React.ReactElement {
  return (
    <div className={styles.breakdown}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>DIMENSIONS</span>
      </div>
      {DIMENSIONS.map((dim) => {
        const dimension = breakdown[dim.key]
        const score = dimension.score ?? 0
        const pct = Math.min(100, Math.max(0, score))

        return (
          <div key={dim.key} className={styles.row}>
            <span className={styles.dimLabel}>{dim.abbr}</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.dimScore}>
              {score !== null ? Math.round(score) : '\u2014'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
