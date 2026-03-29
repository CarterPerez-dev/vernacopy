/**
 * ©AngelaMos | 2026
 * index.tsx
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useLogin } from '@/api/hooks'
import { loginRequestSchema } from '@/api/types'
import { ROUTES } from '@/config'
import { useAuthFormStore } from '@/core/lib'
import styles from './login.module.scss'

export function Component(): React.ReactElement {
  const navigate = useNavigate()
  const login = useLogin()

  const { loginEmail, setLoginEmail, clearLoginForm } = useAuthFormStore()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    const result = loginRequestSchema.safeParse({
      username: loginEmail,
      password,
    })

    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(firstError.message)
      return
    }

    login.mutate(result.data, {
      onSuccess: () => {
        clearLoginForm()
        navigate(ROUTES.DASHBOARD)
      },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={ROUTES.HOME} className={styles.backLink}>
          &larr; BACK
        </Link>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.headerLabel}>AUTHENTICATION</span>
          </div>
          <div className={styles.cardBody}>
            <h1 className={styles.title}>Sign In</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="xxx@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>
                  PASSWORD
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.toggleBtn}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className={styles.submitBtn}
              >
                {login.isPending ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>
          </div>
        </div>

        <p className={styles.altAction}>
          <span className={styles.altText}>No account?</span>
          <Link to={ROUTES.REGISTER} className={styles.altLink}>
            REGISTER
          </Link>
        </p>
      </div>
    </div>
  )
}

Component.displayName = 'Login'
