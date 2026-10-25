interface ProgressBarProps {
  value: number;
  tone?: "green" | "blue" | "amber";
  size?: "sm" | "md";
}

export function ProgressBar({ value, tone = "green", size = "sm" }: ProgressBarProps) {
  return (
    <div className={`progress-track ${size === "md" ? "h-2" : "h-1.5"}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
