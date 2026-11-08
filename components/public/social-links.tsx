import { cn } from "@/lib/utils";

const icons = {
  facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M14.2 8.2V6.6c0-.7.4-1 1.1-1H17V3h-2.2C12.2 3 11 4.5 11 6.8v1.4H9v2.7h2V21h3.2v-10.1h2.2l.4-2.7h-2.6Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="17.2" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M14.2 3h2.3c.2 1.7 1.1 3.1 2.5 3.9.8.5 1.5.7 2.2.8v2.4a6.8 6.8 0 0 1-3.8-1.2v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .7 0 .9.1v2.5a3.2 3.2 0 1 0 2.2 3.1V3Z" />
    </svg>
  ),
} as const;

const tones = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-[radial-gradient(circle_at_30%_110%,#feda75_0%,#fa7e1e_28%,#d62976_58%,#962fbf_78%,#4f5bd5_100%)]",
  tiktok: "bg-black",
} as const;

export function SocialLinks({ items, className }: { items: Array<{ href: string; label: string; icon: keyof typeof icons }>; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white shadow-soft ring-2 ring-white/80 transition duration-150 hover:scale-105 hover:ring-brand-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink motion-reduce:transform-none ${tones[item.icon]}`}
        >
          {icons[item.icon]}
        </a>
      ))}
    </div>
  );
}
