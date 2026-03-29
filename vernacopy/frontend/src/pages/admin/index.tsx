/**
 * ©AngelaMos | 2026
 * index.tsx
 */

import { useState } from 'react'
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminUpdateUser,
  useAdminUsers,
} from '@/api/hooks'
import type { UserResponse } from '@/api/types'
import { UserRole } from '@/api/types'
import { PAGINATION } from '@/config'
import styles from './admin.module.scss'

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; user: UserResponse }
  | { type: 'delete'; user: UserResponse }

export function Component(): React.ReactElement {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })

  const { data, isLoading } = useAdminUsers({
    page,
    size: PAGINATION.DEFAULT_SIZE,
  })
  const createUser = useAdminCreateUser()
  const updateUser = useAdminUpdateUser()
  const deleteUser = useAdminDeleteUser()

  const handleCreate = (formData: FormData): void => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string) || undefined
    const role = formData.get('role') as UserRole
    const isActive = formData.get('isActive') === 'on'

    createUser.mutate(
      { email, password, full_name: fullName, role, is_active: isActive },
      { onSuccess: () => setModal({ type: 'closed' }) }
    )
  }

  const handleUpdate = (userId: string, formData: FormData): void => {
    const email = formData.get('email') as string
    const fullName = (formData.get('fullName') as string) || undefined
    const role = formData.get('role') as UserRole
    const isActive = formData.get('isActive') === 'on'

    updateUser.mutate(
      {
        id: userId,
        data: { email, full_name: fullName, role, is_active: isActive },
      },
      { onSuccess: () => setModal({ type: 'closed' }) }
    )
  }

  const handleDelete = (userId: string): void => {
    deleteUser.mutate(userId, {
      onSuccess: () => setModal({ type: 'closed' }),
    })
  }

  const totalPages = data ? Math.ceil(data.total / PAGINATION.DEFAULT_SIZE) : 0

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.metaLabel}>ADMINISTRATION</span>
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Users</h1>
          <button
            type="button"
            onClick={() => setModal({ type: 'create' })}
            className={styles.createBtn}
          >
            + CREATE USER
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loadingState}>
          <span className={styles.loadingText}>LOADING...</span>
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>NO USERS FOUND</span>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colEmail}>EMAIL</span>
            <span className={styles.colName}>NAME</span>
            <span className={styles.colRole}>ROLE</span>
            <span className={styles.colStatus}>STATUS</span>
            <span className={styles.colActions}>ACTIONS</span>
          </div>
          {data.items.map((user) => (
            <div key={user.id} className={styles.tableRow}>
              <span className={styles.colEmail}>{user.email}</span>
              <span className={styles.colName}>{user.full_name ?? '\u2014'}</span>
              <span className={styles.colRole}>{user.role}</span>
              <span
                className={`${styles.colStatus} ${user.is_active ? styles.statusActive : styles.statusInactive}`}
              >
                {user.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <span className={styles.colActions}>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'edit', user })}
                  aria-label="Edit user"
                  className={styles.rowBtn}
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'delete', user })}
                  aria-label="Delete user"
                  className={styles.rowBtnDanger}
                >
                  DELETE
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {data && data.total > PAGINATION.DEFAULT_SIZE && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className={styles.pageBtn}
          >
            &larr; PREV
          </button>
          <span className={styles.pageInfo}>
            PAGE {page} OF {totalPages} ({data.total} USERS)
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className={styles.pageBtn}
          >
            NEXT &rarr;
          </button>
        </div>
      )}

      {modal.type === 'create' && (
        <div className={styles.modalOverlay}>
          <button
            type="button"
            onClick={() => setModal({ type: 'closed' })}
            onKeyDown={(e) => e.key === 'Escape' && setModal({ type: 'closed' })}
            aria-label="Close modal"
            className={styles.modalBackdrop}
          />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>CREATE USER</span>
              <button
                type="button"
                onClick={() => setModal({ type: 'closed' })}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <form
              className={styles.modalBody}
              onSubmit={(e) => {
                e.preventDefault()
                handleCreate(new FormData(e.currentTarget))
              }}
            >
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  EMAIL
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>
                  PASSWORD
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fullName" className={styles.label}>
                  FULL NAME
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="role" className={styles.label}>
                  ROLE
                </label>
                <select id="role" name="role" className={styles.select}>
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <label className={styles.checkbox}>
                <input type="checkbox" name="isActive" defaultChecked />
                <span>Active</span>
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'closed' })}
                  className={styles.cancelBtn}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className={styles.submitBtn}
                >
                  {createUser.isPending ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.type === 'edit' && (
        <div className={styles.modalOverlay}>
          <button
            type="button"
            onClick={() => setModal({ type: 'closed' })}
            onKeyDown={(e) => e.key === 'Escape' && setModal({ type: 'closed' })}
            aria-label="Close modal"
            className={styles.modalBackdrop}
          />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>EDIT USER</span>
              <button
                type="button"
                onClick={() => setModal({ type: 'closed' })}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <form
              className={styles.modalBody}
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdate(modal.user.id, new FormData(e.currentTarget))
              }}
            >
              <div className={styles.field}>
                <label htmlFor="editEmail" className={styles.label}>
                  EMAIL
                </label>
                <input
                  id="editEmail"
                  name="email"
                  type="email"
                  defaultValue={modal.user.email}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="editFullName" className={styles.label}>
                  FULL NAME
                </label>
                <input
                  id="editFullName"
                  name="fullName"
                  type="text"
                  defaultValue={modal.user.full_name ?? ''}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="editRole" className={styles.label}>
                  ROLE
                </label>
                <select
                  id="editRole"
                  name="role"
                  defaultValue={modal.user.role}
                  className={styles.select}
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={modal.user.is_active}
                />
                <span>Active</span>
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'closed' })}
                  className={styles.cancelBtn}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updateUser.isPending}
                  className={styles.submitBtn}
                >
                  {updateUser.isPending ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.type === 'delete' && (
        <div className={styles.modalOverlay}>
          <button
            type="button"
            onClick={() => setModal({ type: 'closed' })}
            onKeyDown={(e) => e.key === 'Escape' && setModal({ type: 'closed' })}
            aria-label="Close modal"
            className={styles.modalBackdrop}
          />
          <div className={styles.modal}>
            <div className={styles.modalHeaderDanger}>
              <span className={styles.modalTitle}>DELETE USER</span>
              <button
                type="button"
                onClick={() => setModal({ type: 'closed' })}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteMessage}>
                Are you sure you want to delete{' '}
                <strong>{modal.user.email}</strong>? This action cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'closed' })}
                  className={styles.cancelBtn}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(modal.user.id)}
                  disabled={deleteUser.isPending}
                  className={styles.deleteBtn}
                >
                  {deleteUser.isPending ? 'DELETING...' : 'DELETE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

Component.displayName = 'AdminUsers'
