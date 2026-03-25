import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-[color:var(--text-secondary)]">{label}</span>
        {hint ? <span className="text-xs text-[color:var(--text-tertiary)]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
