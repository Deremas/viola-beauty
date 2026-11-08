"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover print:hidden">
      Print receipt
    </button>
  );
}
