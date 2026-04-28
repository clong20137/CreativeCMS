import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  message: string
  title?: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (options: { message: string; title?: string; tone?: ToastTone }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function toneClasses(tone: ToastTone) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (tone === 'error') return 'border-red-200 bg-red-50 text-red-900'
  return 'border-blue-200 bg-white text-slate-900'
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <FiCheckCircle className="h-5 w-5 text-emerald-600" />
  if (tone === 'error') return <FiAlertCircle className="h-5 w-5 text-red-600" />
  return <FiInfo className="h-5 w-5 text-blue-600" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(({ message, title, tone = 'info' }: { message: string; title?: string; tone?: ToastTone }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((current) => [...current, { id, message, title, tone }].slice(-4))
    window.setTimeout(() => dismissToast(id), 4200)
  }, [dismissToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[200] flex flex-col gap-3 sm:left-auto sm:right-5 sm:w-[22rem]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${toneClasses(toast.tone)}`}
          >
            <div className="flex items-start gap-3">
              <ToneIcon tone={toast.tone} />
              <div className="min-w-0 flex-1">
                {toast.title && <p className="text-sm font-bold">{toast.title}</p>}
                <p className="text-sm leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current"
                aria-label="Dismiss notification"
              >
                <FiX />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
