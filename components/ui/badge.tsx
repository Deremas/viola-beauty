import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  amber: "border-amber-300 bg-amber-100 text-amber-800",
  green: "border-emerald-300 bg-emerald-100 text-emerald-800",
  red: "border-red-300 bg-red-100 text-red-800",
  blue: "border-blue-300 bg-blue-100 text-blue-800",
  gray: "border-stone-300 bg-stone-100 text-stone-700",
};

export function Badge({
  className,
  tone = "gray",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
