import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ConfirmType = 'info' | 'warn' | 'danger';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext(undefined as unknown as ConfirmContextValue | undefined);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return ctx.confirm;
};

export function ConfirmProvider({ children }: { children: any }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({ message: '' } as ConfirmOptions);
  const resolverRef = useRef(function noop(_: boolean){} as any);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts({
        title: options.title ?? 'Confirmar',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirmar',
        cancelText: options.cancelText ?? 'Cancelar',
        type: options.type ?? 'info',
      });
      resolverRef.current = resolve;
      setOpen(true);
      // pausar polling global (se existir)
      try { window.dispatchEvent(new CustomEvent('mdac:pausePolling')); } catch(_) {}
    });
  }, []);

  const close = useCallback((val: boolean) => {
    setOpen(false);
    try { resolverRef.current(val); } catch(_) {}
    // retomar polling global (se existir)
    try { window.dispatchEvent(new CustomEvent('mdac:resumePolling')); } catch(_) {}
  }, []);

  const onBackdrop = (e: any) => {
    if (e.target === e.currentTarget) close(false);
  };

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') close(false);
  }, [close]);

  React.useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKey]);

  const ctx: ConfirmContextValue = useMemo(() => ({ confirm }), [confirm]);

  const colorClass = opts.type === 'danger' ? 'bg-red-600 hover:bg-red-700'
                    : opts.type === 'warn' ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-brand-blue hover:bg-brand-blue/90';

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
          onClick={onBackdrop}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <i className={`fa-solid fa-circle-question text-2xl ${opts.type === 'danger' ? 'text-red-600' : opts.type === 'warn' ? 'text-orange-500' : 'text-brand-blue'}`}></i>
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1">{opts.title}</div>
                <div className="text-gray-600">{opts.message}</div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50"
                onClick={() => close(false)}
              >
                {opts.cancelText}
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-white ${colorClass}`}
                onClick={() => close(true)}
                autoFocus
              >
                {opts.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
