import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section className={`card fade-in p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </section>
  );
}
