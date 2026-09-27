import { useId, cloneElement, type ReactElement } from 'react';

export function FormField({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }> }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink/80">{label}</label>
      {cloneElement(children, { id, 'aria-invalid': !!error, 'aria-describedby': error ? errId : undefined })}
      {hint && !error && <p className="text-xs text-ink/50">{hint}</p>}
      {error && <p id={errId} className="pop text-xs font-medium text-rally">{error}</p>}
    </div>
  );
}
