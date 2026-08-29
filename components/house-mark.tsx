export function HouseMark({ className }: { className?: string }) {
  return (
    <span className={className ?? "home-shell-mark"} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2.4 14.4 8h-1.7v5.2H3.3V8H1.6L8 2.4z" />
      </svg>
    </span>
  );
}
