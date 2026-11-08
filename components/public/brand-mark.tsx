import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ tone = "dark", compact = false, className }: { tone?: "dark" | "light"; compact?: boolean; className?: string }) {
  return (
    <span className={cn("block min-w-0 max-w-full", compact ? "w-[7.25rem] min-[380px]:w-32 sm:w-36 lg:w-40" : "w-44 sm:w-52", className)}>
      <Image
        src={tone === "light" ? "/brand/viola-logo-white.png" : "/brand/viola-logo.png"}
        alt=""
        width={800}
        height={403}
        quality={100}
        sizes={compact ? "(min-width: 1024px) 160px, 144px" : "208px"}
        priority={tone === "dark"}
        className="h-auto w-full max-w-full"
      />
    </span>
  );
}
