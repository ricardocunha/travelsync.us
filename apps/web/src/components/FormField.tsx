import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-[color:var(--ink-800)]">{label}</span>
        {hint ? <span className="text-xs text-[color:var(--ink-600)]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
