import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section className={`paper-panel page-enter rounded-[2.1rem] p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </section>
  );
}
