import { BrandMark } from "@/components/public/brand-mark";
import { companyName } from "@/lib/brand";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-brand-mist px-6" role="status" aria-live="polite" aria-label={`Loading ${companyName}`}>
      <div className="flex flex-col items-center">
        <div className="rounded-[2rem] bg-white px-8 py-6 shadow-soft">
          <BrandMark className="w-56 sm:w-64" />
        </div>
        <div className="mt-8 h-1 w-36 overflow-hidden rounded-full bg-brand-line" aria-hidden>
          <div className="viola-load-bar h-full w-1/3 rounded-full bg-brand" />
        </div>
      </div>
    </div>
  );
}
