// ===========================
// ©AngelaMos | 2026
// App.tsx
// ===========================

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/core/api'
import { router } from '@/core/app/routers'
import '@/core/app/toast.module.scss'

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          duration={2000}
          theme="dark"
          toastOptions={{
            style: {
              background: '#1C1917',
              border: '2px solid #1C1917',
              color: '#F2EDE8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              borderRadius: '0',
            },
          }}
        />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
