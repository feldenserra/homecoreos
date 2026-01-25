'use client'

import { createContext, useContext, useState, useCallback } from 'react'

// 1. The Types
type ToastType = 'success' | 'error' | 'info'
interface ToastContextType {
  toast: (msg: string, type?: ToastType) => void
}

// 2. The Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// 3. The Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{id: number, msg: string, type: ToastType}[]>([])

  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* THE GLOBAL UI CONTAINER */}
      <div className="toast toast-end toast-bottom z-[9999] p-4 gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`
              alert shadow-lg min-w-[200px] pointer-events-auto animate-[bounce_0.2s_ease-out]
              ${t.type === 'success' ? 'alert-success' : ''}
              ${t.type === 'error' ? 'alert-error' : ''}
              ${t.type === 'info' ? 'alert-info' : ''}
            `}
          >
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// 4. The Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}