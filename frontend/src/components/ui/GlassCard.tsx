import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border border-border 
      bg-surface backdrop-blur-md shadow-xl p-6 
      transition-all hover:border-primary/50
      ${className}
    `}>
      {children}
    </div>
  );
}