// ===================
// © AngelaMos | 2026
// highlighted-text.tsx
// ===================

import type { TokenResult } from '@/api/types'
import styles from './highlighted-text.module.scss'
import { WordPopover } from './word-popover'

interface HighlightedTextProps {
  tokens: TokenResult[]
  onReplace: (position: number, endPosition: number, newWord: string) => void
}

function isActionable(token: TokenResult): boolean {
  return (
    !token.is_whitespace &&
    !token.is_stopword &&
    (token.tier === 'C' || token.tier === 'D') &&
    token.score != null &&
    token.tier != null
  )
}

function getTierClass(tier: string | null | undefined): string {
  if (!tier) return ''
  const map: Record<string, string> = {
    S: styles.tokenS ?? '',
    A: styles.tokenA ?? '',
    B: styles.tokenB ?? '',
    C: styles.tokenC ?? '',
    D: styles.tokenD ?? '',
  }
  return map[tier] ?? ''
}

export function HighlightedText({
  tokens,
  onReplace,
}: HighlightedTextProps): React.ReactElement {
  return (
    <div className={styles.textBlock}>
      {tokens.map((token) => {
        if (token.is_whitespace) {
          return <span key={token.position}>{token.text}</span>
        }

        if (isActionable(token)) {
          return (
            <WordPopover
              key={token.position}
              word={token.text}
              score={token.score as number}
              tier={token.tier as string}
              suggestions={token.suggestions ?? []}
              onReplace={(newWord) =>
                onReplace(token.position, token.end_position, newWord)
              }
            >
              <span className={`${styles.wordBtn} ${getTierClass(token.tier)}`}>
                {token.text}
              </span>
            </WordPopover>
          )
        }

        return (
          <span
            key={token.position}
            className={`${styles.word} ${getTierClass(token.tier)}`}
          >
            {token.text}
          </span>
        )
      })}
    </div>
  )
}
