import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "outline";
type Size = "default" | "lg";

const variants: Record<Variant, string> = {
  default: "bg-stone-900 text-white hover:bg-stone-800",
  outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
};

const sizes: Record<Size, string> = {
  default: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({
  variant = "default",
  size = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
