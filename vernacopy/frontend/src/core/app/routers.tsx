// ===================
// © AngelaMos | 2025
// routers.tsx
// ===================

import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { UserRole } from '@/api/types'
import { ROUTES } from '@/config'
import { ProtectedRoute } from './protected-route'
import { Shell } from './shell'

const routes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    lazy: () => import('@/pages/landing'),
  },
  {
    path: ROUTES.LOGIN,
    lazy: () => import('@/pages/login'),
  },
  {
    path: ROUTES.REGISTER,
    lazy: () => import('@/pages/register'),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Shell />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            lazy: () => import('@/pages/dashboard'),
          },
          {
            path: ROUTES.TOOLS.WORD_CLARITY,
            lazy: () => import('@/pages/tools/word-clarity'),
          },
          {
            path: ROUTES.TOOLS.WORD_CLARITY_HISTORY,
            lazy: () => import('@/pages/tools/word-clarity/history'),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
    children: [
      {
        element: <Shell />,
        children: [
          {
            path: ROUTES.ADMIN.USERS,
            lazy: () => import('@/pages/admin'),
          },
        ],
      },
    ],
  },
  {
    path: ROUTES.UNAUTHORIZED,
    lazy: () => import('@/pages/landing'),
  },
  {
    path: '*',
    lazy: () => import('@/pages/landing'),
  },
]

export const router = createBrowserRouter(routes)
