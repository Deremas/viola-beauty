"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fieldLabel } from "@/lib/form-fields";

function Notice() {
  const params = useSearchParams();
  const message = params.get("formError");
  const field = params.get("field");
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
      {field ? <span className="font-semibold">{fieldLabel(field)}: </span> : null}
      {message}
    </p>
  );
}

export function FormFeedback() {
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  );
}
