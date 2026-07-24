"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

const tokenKey = "viola_booking_submission_token";
const attemptKey = "viola_booking_submission_attempt";

function newToken() {
  return crypto.randomUUID();
}

export function BookingSubmissionGuard({ formId }: { formId: string }) {
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function recover(submissionToken: string, phone: string) {
      setChecking(true);
      try {
        const response = await fetch("/api/public/bookings/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionToken, phone }),
        });
        const result = await response.json();
        if (result.state === "BOOKING_FOUND" && result.bookingCode) {
          window.location.replace(`/book/success/${encodeURIComponent(result.bookingCode)}`);
          return;
        }
        if (result.state === "STILL_PROCESSING") {
          window.setTimeout(() => void recover(submissionToken, phone), 3000);
          return;
        }
        localStorage.removeItem(attemptKey);
        if (result.state === "FAILED") {
          const replacement = newToken();
          localStorage.setItem(tokenKey, replacement);
          setToken(replacement);
        }
      } catch {
        // Keep the recovery record so the next page load can safely try again.
      } finally {
        setChecking(false);
      }
    }

    let currentToken = localStorage.getItem(tokenKey);
    if (!currentToken) {
      currentToken = newToken();
      localStorage.setItem(tokenKey, currentToken);
    }
    setToken(currentToken);

    const form = document.getElementById(formId) as HTMLFormElement | null;
    const rememberAttempt = () => {
      const phone = String(new FormData(form || undefined).get("phone") || "");
      localStorage.setItem(attemptKey, JSON.stringify({ token: currentToken, phone, attemptedAt: Date.now() }));
    };
    form?.addEventListener("submit", rememberAttempt);

    const saved = localStorage.getItem(attemptKey);
    if (saved) {
      try {
        const attempt = JSON.parse(saved) as { token?: string; phone?: string };
        if (attempt.token && attempt.phone) void recover(attempt.token, attempt.phone);
      } catch {
        localStorage.removeItem(attemptKey);
      }
    }
    return () => form?.removeEventListener("submit", rememberAttempt);
  }, [formId]);

  return <>
    <input type="hidden" name="submissionToken" value={token} required />
    {checking ? <div className="fixed inset-x-4 top-20 z-[90] mx-auto flex max-w-xl items-center gap-3 rounded-xl border bg-white p-4 shadow-2xl"><Loader2 className="h-5 w-5 animate-spin text-primary" /><div><p className="font-bold">Checking your previous booking</p><p className="text-sm text-muted-foreground">We will not create another booking if your earlier request was received.</p></div></div> : null}
  </>;
}

export function ClearBookingSubmission() {
  useEffect(() => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(attemptKey);
  }, []);
  return <span className="sr-only"><ShieldCheck className="h-3 w-3" />Booking recovery saved</span>;
}
