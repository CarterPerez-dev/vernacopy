/**
 * ©AngelaMos | 2026
 * index.tsx
 */

import { Link } from 'react-router-dom'
import { ROUTES } from '@/config'
import styles from './landing.module.scss'

const TIERS = [
  { label: 'S', range: '90–100', desc: 'Universal' },
  { label: 'A', range: '75–89', desc: 'Common' },
  { label: 'B', range: '55–74', desc: 'Intermediate' },
  { label: 'C', range: '35–54', desc: 'Complex' },
  { label: 'D', range: '0–34', desc: 'Jargon' },
]

const FEATURES = [
  {
    num: '01',
    title: 'Word Lookup',
    desc: 'Score any English word 0-100. See frequency, age-of-acquisition, concreteness, and familiarity breakdowns. Get clearer alternatives ranked by clarity.',
  },
  {
    num: '02',
    title: 'Copy Scanner',
    desc: 'Paste full copy blocks. Every word gets color-coded by tier. Click any flagged word for instant replacement suggestions.',
  },
  {
    num: '03',
    title: 'Word Compare',
    desc: 'Side-by-side clarity comparison. Visual breakdowns across all four psycholinguistic dimensions. Pick the word that hits clearest.',
  },
]

export function Component(): React.ReactElement {
  return (
    <div className={styles.landing}>
      <nav className={styles.topBar}>
        <span className={styles.topBrand}>VernaCopy</span>
        <span className={styles.topMeta}>WORD CLARITY TOOL</span>
        <div className={styles.topActions}>
          <Link to={ROUTES.LOGIN} className={styles.signInLink}>
            SIGN IN
          </Link>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            <span className={styles.metaLabel}>FREQUENCY</span>
            <span className={styles.metaChevron}>
              &rsaquo;&rsaquo;&rsaquo;&rsaquo;
            </span>
            <span className={styles.metaLabel}>ACQUISITION</span>
            <span className={styles.metaChevron}>
              &rsaquo;&rsaquo;&rsaquo;&rsaquo;
            </span>
            <span className={styles.metaLabel}>CONCRETENESS</span>
            <span className={styles.metaChevron}>
              &rsaquo;&rsaquo;&rsaquo;&rsaquo;
            </span>
            <span className={styles.metaLabel}>FAMILIARITY</span>
          </div>
          <h1 className={styles.heroTitle}>
            Measure
            <br />
            Every
            <br />
            Word
          </h1>
          <p className={styles.heroDesc}>
            Data-backed clarity scoring powered by psycholinguistic research.
            Score any word 0–100 and get clearer alternatives instantly.
          </p>
          <div className={styles.heroCta}>
            <Link to={ROUTES.REGISTER} className={styles.ctaPrimary}>
              GET STARTED
            </Link>
            <Link to={ROUTES.LOGIN} className={styles.ctaSecondary}>
              SIGN IN
            </Link>
          </div>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.tierTable}>
            <div className={styles.tierTableHeader}>
              <span className={styles.tierTableLabel}>CLARITY TIERS</span>
            </div>
            {TIERS.map((t) => (
              <div
                key={t.label}
                className={`${styles.tierRow} ${styles[`tierRow${t.label}`]}`}
              >
                <span className={styles.tierLetter}>{t.label}</span>
                <span className={styles.tierRange}>{t.range}</span>
                <span className={styles.tierDesc}>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rule} />

      <div className={styles.features}>
        <div className={styles.featuresHeader}>
          <span className={styles.featuresLabel}>CAPABILITIES</span>
          <span className={styles.featuresCount}>03 TOOLS</span>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.num} className={styles.featureCard}>
              <span className={styles.featureNum}>{f.num}</span>
              <h2 className={styles.featureTitle}>{f.title}</h2>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rule} />

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>VERNACOPY</span>
        <span className={styles.footerMeta}>
          DATA-BACKED WORD CLARITY SCORING
        </span>
        <span className={styles.footerMeta}>© ANGELAMOS 2026</span>
      </footer>
    </div>
  )
}

Component.displayName = 'Landing'
