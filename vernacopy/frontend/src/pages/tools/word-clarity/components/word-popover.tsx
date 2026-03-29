// ===================
// © AngelaMos | 2026
// word-popover.tsx
// ===================

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AlternativeWord } from '@/api/types'
import { TierBadge } from './tier-badge'
import styles from './word-popover.module.scss'

interface WordPopoverProps {
  word: string
  score: number
  tier: string
  suggestions: AlternativeWord[]
  onReplace: (newWord: string) => void
  children: ReactNode
}

export function WordPopover({
  word,
  score,
  tier,
  suggestions,
  onReplace,
  children,
}: WordPopoverProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (triggerRef.current === null) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    })
  }, [])

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen((prev) => !prev)
  }, [isOpen, updatePosition])

  const handleReplace = useCallback(
    (newWord: string) => {
      onReplace(newWord)
      setIsOpen(false)
    },
    [onReplace]
  )

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        tabIndex={0}
        className={styles.trigger}
      >
        {children}
      </button>

      {isOpen &&
        createPortal(
          <>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              tabIndex={-1}
              aria-label="Close popover"
              className={styles.backdrop}
            />
            <div
              className={styles.popover}
              style={{
                top: position.top,
                left: position.left,
              }}
            >
              <div className={styles.popoverHeader}>
                <span className={styles.popoverWord}>{word}</span>
                <span className={styles.popoverScore}>{Math.round(score)}</span>
                <TierBadge tier={tier} size="sm" />
              </div>

              {suggestions.length > 0 ? (
                <div className={styles.suggestionList}>
                  <div className={styles.suggestionLabel}>ALTERNATIVES</div>
                  {suggestions.map((alt) => (
                    <button
                      key={alt.word}
                      type="button"
                      onClick={() => handleReplace(alt.word)}
                      className={styles.suggestionBtn}
                    >
                      <span className={styles.suggestionWord}>{alt.word}</span>
                      <span className={styles.suggestionScore}>
                        {Math.round(alt.clarity_score)}
                      </span>
                      <TierBadge tier={alt.tier} size="sm" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.noAlts}>NO ALTERNATIVES AVAILABLE</div>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  )
}
