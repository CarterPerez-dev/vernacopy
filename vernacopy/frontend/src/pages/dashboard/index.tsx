/**
 * ©AngelaMos | 2026
 * index.tsx
 */

import { Link } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useIsAdmin, useUser } from '@/core/lib'
import styles from './dashboard.module.scss'

const QUICK_STATS = [
  { value: '\u2014', label: 'WORDS ANALYZED' },
  { value: '\u2014', label: 'SCANS RUN' },
  { value: '\u2014', label: 'AVG CLARITY' },
]

const QUICK_ACTIONS = [
  {
    title: 'Word Lookup',
    description: 'Check the clarity score of any word instantly',
    to: ROUTES.TOOLS.WORD_CLARITY,
    num: '01',
  },
  {
    title: 'Scan Copy',
    description: 'Analyze a block of text for unclear language',
    to: ROUTES.TOOLS.WORD_CLARITY,
    num: '02',
  },
  {
    title: 'View History',
    description: 'Browse your past lookups and scan results',
    to: ROUTES.TOOLS.WORD_CLARITY_HISTORY,
    num: '03',
  },
]

export function Component(): React.ReactElement {
  const user = useUser()
  const isAdmin = useIsAdmin()

  const displayName = user?.full_name ?? user?.email ?? 'User'

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.metaLabel}>DASHBOARD</span>
          {isAdmin && <span className={styles.adminBadge}>ADMIN</span>}
        </div>
        <h1 className={styles.greeting}>Welcome back,</h1>
        <h2 className={styles.userName}>{displayName}</h2>
      </div>

      <div className={styles.statsGrid}>
        {QUICK_STATS.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.actionsSection}>
        <div className={styles.actionsHeader}>
          <span className={styles.actionsLabel}>QUICK ACTIONS</span>
        </div>
        <div className={styles.actionsList}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.title} to={action.to} className={styles.actionRow}>
              <span className={styles.actionNum}>{action.num}</span>
              <div className={styles.actionContent}>
                <span className={styles.actionTitle}>{action.title}</span>
                <span className={styles.actionDesc}>{action.description}</span>
              </div>
              <span className={styles.actionArrow}>&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'Dashboard'
