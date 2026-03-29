/**
 * ©AngelaMos | 2026
 * shell.tsx
 */

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useLogout } from '@/api/hooks'
import { ROUTES } from '@/config'
import { useIsAdmin, useUIStore, useUser } from '@/core/lib'
import styles from './shell.module.scss'

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard' },
  { path: ROUTES.TOOLS.WORD_CLARITY, label: 'Word Clarity' },
]

const ADMIN_NAV_ITEM = {
  path: ROUTES.ADMIN.USERS,
  label: 'Admin',
}

function ShellErrorFallback({ error }: { error: Error }): React.ReactElement {
  return (
    <div className={styles.errorFallback}>
      <h2 className={styles.errorTitle}>SYSTEM ERROR</h2>
      <pre className={styles.errorMessage}>{error.message}</pre>
    </div>
  )
}

function ShellLoading(): React.ReactElement {
  return (
    <div className={styles.loading}>
      <span className={styles.loadingText}>INITIALIZING</span>
      <span className={styles.loadingDots}>...</span>
    </div>
  )
}

export function Shell(): React.ReactElement {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { mutate: logout } = useLogout()
  const isAdmin = useIsAdmin()
  const user = useUser()

  const avatarLetter =
    user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to={ROUTES.DASHBOARD} className={styles.brand}>
            VernaCopy
          </Link>

          <div className={styles.navLinks}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to={ADMIN_NAV_ITEM.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {ADMIN_NAV_ITEM.label}
              </NavLink>
            )}
          </div>

          <div className={styles.navActions}>
            <span className={styles.avatar}>{avatarLetter}</span>
            <button
              type="button"
              onClick={() => logout()}
              className={styles.exitBtn}
            >
              EXIT
            </button>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            className={styles.menuToggle}
          >
            {sidebarOpen ? '✕' : '≡'}
          </button>
        </div>
      </nav>

      {sidebarOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
          aria-label="Close menu"
          className={styles.overlay}
        />
      )}

      {sidebarOpen && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarLabel}>NAVIGATION</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => sidebarOpen && toggleSidebar()}
              className={({ isActive }) =>
                `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to={ADMIN_NAV_ITEM.path}
              onClick={() => sidebarOpen && toggleSidebar()}
              className={({ isActive }) =>
                `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
              }
            >
              {ADMIN_NAV_ITEM.label}
            </NavLink>
          )}
          <div className={styles.sidebarDivider} />
          <button
            type="button"
            onClick={() => logout()}
            className={styles.sidebarLogout}
          >
            LOGOUT
          </button>
        </div>
      )}

      <main className={styles.main}>
        <ErrorBoundary FallbackComponent={ShellErrorFallback}>
          <Suspense fallback={<ShellLoading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
