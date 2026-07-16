import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 font-semibold shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading page...
      </div>
    </div>
  );
}
