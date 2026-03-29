// ===================
// © AngelaMos | 2026
// tier-badge.tsx
// ===================

import styles from './tier-badge.module.scss'

interface TierBadgeProps {
  tier: string
  size?: 'sm' | 'md'
}

export function TierBadge({
  tier,
  size = 'sm',
}: TierBadgeProps): React.ReactElement {
  return (
    <span className={`${styles.badge} ${styles[`tier${tier}`]} ${styles[size]}`}>
      {tier}
    </span>
  )
}
