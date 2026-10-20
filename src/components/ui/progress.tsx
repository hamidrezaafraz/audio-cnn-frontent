export function Progress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={`relative w-full overflow-hidden rounded-full bg-stone-200 ${className}`}
    >
      <div
        className="h-full rounded-full bg-stone-900 transition-all duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
