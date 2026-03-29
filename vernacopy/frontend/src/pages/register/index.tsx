/**
 * ©AngelaMos | 2026
 * index.tsx
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRegister } from '@/api/hooks'
import { userCreateRequestSchema } from '@/api/types'
import { PASSWORD_CONSTRAINTS, ROUTES } from '@/config'
import { useAuthFormStore } from '@/core/lib'
import styles from './register.module.scss'

const registerFormSchema = userCreateRequestSchema
  .extend({
    confirmPassword: z
      .string()
      .min(
        PASSWORD_CONSTRAINTS.MIN_LENGTH,
        `Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`
      )
      .max(PASSWORD_CONSTRAINTS.MAX_LENGTH),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function Component(): React.ReactElement {
  const navigate = useNavigate()
  const register = useRegister()

  const { registerEmail, setRegisterEmail, clearRegisterForm } =
    useAuthFormStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    const result = registerFormSchema.safeParse({
      email: registerEmail,
      password,
      confirmPassword,
    })

    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(firstError.message)
      return
    }

    register.mutate(
      { email: result.data.email, password: result.data.password },
      {
        onSuccess: () => {
          clearRegisterForm()
          toast.success('Account created successfully')
          navigate(ROUTES.LOGIN)
        },
      }
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to={ROUTES.HOME} className={styles.backLink}>
          &larr; BACK
        </Link>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.headerLabel}>REGISTRATION</span>
          </div>
          <div className={styles.cardBody}>
            <h1 className={styles.title}>Create Account</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="xxx@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
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
                    autoComplete="new-password"
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

              <div className={styles.field}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  CONFIRM PASSWORD
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    className={styles.toggleBtn}
                  >
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={register.isPending}
                className={styles.submitBtn}
              >
                {register.isPending ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        </div>

        <p className={styles.altAction}>
          <span className={styles.altText}>Already have an account?</span>
          <Link to={ROUTES.LOGIN} className={styles.altLink}>
            SIGN IN
          </Link>
        </p>
      </div>
    </div>
  )
}

Component.displayName = 'Register'
