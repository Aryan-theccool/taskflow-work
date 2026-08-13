import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { gsap } from '../gsapSetup';

type ToastKind = 'error' | 'success';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  push: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastApi>({ push: () => {} });

export function useToasts() {
  return useContext(ToastContext);
}

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const node = document.querySelector<HTMLElement>(`[data-toast="${id}"]`);
    const drop = () => setToasts((prev) => prev.filter((t) => t.id !== id));
    if (node) {
      gsap.to(node, { x: 60, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: drop });
    } else {
      drop();
    }
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      requestAnimationFrame(() => {
        const node = document.querySelector<HTMLElement>(`[data-toast="${id}"]`);
        if (node) gsap.from(node, { x: 60, opacity: 0, duration: 0.45, ease: 'power3.out' });
      });
      timers.current.set(id, setTimeout(() => dismiss(id), 5200));
    },
    [dismiss]
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} data-toast={toast.id} className={`toast toast--${toast.kind}`}>
            <span className="toast__dot" />
            <p>{toast.message}</p>
            <button
              className="toast__close"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
