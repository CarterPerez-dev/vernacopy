// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeleteScan, useScanHistory } from '@/api/hooks'
import { ROUTES } from '@/config'
import { TierBadge } from '../components/tier-badge'
import styles from './history.module.scss'

function getTierForScore(score: number): string {
  if (score >= 80) return 'S'
  if (score >= 60) return 'A'
  if (score >= 40) return 'B'
  if (score >= 20) return 'C'
  return 'D'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PAGE_SIZE = 20

export function Component(): React.ReactElement {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useScanHistory({
    page,
    size: PAGE_SIZE,
  })
  const deleteScan = useDeleteScan()

  const totalPages = data !== undefined ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <h1 className={styles.title}>Scan History</h1>
        <Link to={ROUTES.TOOLS.WORD_CLARITY} className={styles.backLink}>
          &larr; BACK TO TOOL
        </Link>
      </div>

      {isLoading && (
        <div className={styles.loadingState}>
          <span className={styles.loadingText}>LOADING HISTORY...</span>
        </div>
      )}

      {isError && (
        <div className={styles.errorState}>
          <span className={styles.errorText}>FAILED TO LOAD SCAN HISTORY</span>
        </div>
      )}

      {data !== undefined && data.items.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyTitle}>NO SCANS YET</span>
          <span className={styles.emptyDesc}>
            Run your first copy scan to see results here
          </span>
        </div>
      )}

      {data !== undefined && data.items.length > 0 && (
        <>
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span className={styles.listLabel}>SCAN RESULTS</span>
              <span className={styles.listCount}>{data.total} TOTAL</span>
            </div>
            {data.items.map((item) => {
              const tier = getTierForScore(item.overall_score ?? 0)

              return (
                <div key={item.id} className={styles.row}>
                  <div
                    className={`${styles.rowBorder} ${styles[`rowBorder${tier}`]}`}
                  />
                  <div className={styles.rowContent}>
                    <span className={styles.rowPreview}>
                      {item.input_text_preview}
                    </span>
                    <div className={styles.rowMeta}>
                      <span className={styles.rowScore}>
                        {Math.round(item.overall_score ?? 0)}
                      </span>
                      <TierBadge tier={tier} size="sm" />
                      <span className={styles.rowDate}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteScan.mutate(item.id)}
                    disabled={deleteScan.isPending}
                    className={styles.deleteBtn}
                  >
                    DELETE
                  </button>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={styles.pageBtn}
              >
                &larr; PREV
              </button>
              <span className={styles.pageInfo}>
                PAGE {page} OF {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={styles.pageBtn}
              >
                NEXT &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

Component.displayName = 'WordClarityHistory'
