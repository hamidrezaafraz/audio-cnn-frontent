import type { HTMLAttributes } from "react";

type Variant = "default" | "secondary";

const variants: Record<Variant, string> = {
  default: "bg-stone-900 text-white",
  secondary: "bg-stone-100 text-stone-800",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
