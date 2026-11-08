"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  id,
  name,
  description,
  allow = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  name: string;
  description: string;
  allow?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)} aria-label={`Delete ${name}`}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <form action={action} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="confirm" value="yes" />
            <h2 id="confirm-delete-title" className="font-display text-2xl font-semibold">Delete {name}?</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              {allow ? <Button type="submit" variant="destructive" pendingText="Deleting...">Delete</Button> : null}
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
