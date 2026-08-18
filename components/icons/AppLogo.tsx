export function AppLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg bg-primary ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-[62%] w-[62%]"
        fill="none"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="7.2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 12l7.5-7.5" />
      </svg>
    </span>
  );
}
