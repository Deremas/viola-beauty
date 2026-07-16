"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentProofViewer({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <ExternalLink className="h-4 w-4" />
        Open payment proof
      </Button>

      <button
        type="button"
        className="block w-fit cursor-zoom-in rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
        aria-label="Open payment proof preview"
      >
        <Image
          src={src}
          alt={alt}
          width={900}
          height={700}
          unoptimized
          className="max-h-72 rounded-md border object-contain"
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Payment proof preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/20 bg-background shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="font-semibold">Payment proof</p>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} autoFocus>
                <X className="h-4 w-4" />
                Close proof
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/90 p-3">
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1200}
                unoptimized
                className="max-h-[82vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

