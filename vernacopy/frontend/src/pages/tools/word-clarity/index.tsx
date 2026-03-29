// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import { Link } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useActiveTab, useClarityEditorStore } from '@/core/lib'
import { CopyScanner } from './components/copy-scanner'
import { WordCompare } from './components/word-compare'
import { WordLookup } from './components/word-lookup'
import styles from './word-clarity.module.scss'

type TabId = 'lookup' | 'scanner' | 'compare'

const TABS: { id: TabId; label: string }[] = [
  { id: 'lookup', label: 'Word Lookup' },
  { id: 'scanner', label: 'Copy Scanner' },
  { id: 'compare', label: 'Compare' },
]

export function Component(): React.ReactElement {
  const activeTab = useActiveTab()
  const setActiveTab = useClarityEditorStore((s) => s.setActiveTab)

  return (
    <div className={styles.tool}>
      <div className={styles.toolHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Word Clarity</h1>
          <Link
            to={ROUTES.TOOLS.WORD_CLARITY_HISTORY}
            className={styles.historyLink}
          >
            SCAN HISTORY &rarr;
          </Link>
        </div>

        <div className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'lookup' && <WordLookup />}
        {activeTab === 'scanner' && <CopyScanner />}
        {activeTab === 'compare' && <WordCompare />}
      </div>
    </div>
  )
}

Component.displayName = 'WordClarity'
