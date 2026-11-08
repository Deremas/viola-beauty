"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { registerForCourse } from "@/app/courses/[slug]/register/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const draftKey = "viola-registration-draft";

type DraftFields = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  experience: string;
  intakeName: string;
  expectedStartDate: string;
  notes: string;
  consent: boolean;
};

const emptyFields: DraftFields = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  experience: "",
  intakeName: "",
  expectedStartDate: "",
  notes: "",
  consent: false,
};

export function RegistrationForm({
  slug,
  courseName,
  courses,
}: {
  slug: string;
  courseName: string;
  courses: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<DraftFields>(emptyFields);
  const [draftReady, setDraftReady] = useState(false);
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState(registerForCourse, { error: "" });
  const choices = courses.some((course) => course.slug === slug) ? courses : [{ slug, name: courseName }, ...courses];

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "");
      if (saved?.fields) setFields({ ...emptyFields, ...saved.fields });
      if (saved?.idempotencyKey) setIdempotencyKey(saved.idempotencyKey);
      if (saved?.step >= 1 && saved.step <= 3) setStep(saved.step);
    } catch {
      /* A missing draft starts the form empty. */
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem(draftKey, JSON.stringify({ fields, step, idempotencyKey }));
  }, [draftReady, fields, step, idempotencyKey]);

  function update(name: keyof DraftFields, value: string | boolean) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function switchCourse(nextSlug: string) {
    if (nextSlug === slug) return;
    sessionStorage.setItem(draftKey, JSON.stringify({ fields, step, idempotencyKey }));
    router.push(`/courses/${nextSlug}/register`);
  }

  function next() {
    if (step === 1 && (fields.fullName.trim().length < 2 || fields.phone.trim().length < 9)) {
      setClientError("Enter a full name and mobile number to continue.");
      return;
    }
    setClientError("");
    setStep((value) => Math.min(3, value + 1));
  }

  return (
    <form action={action} className="rounded-2xl border bg-white p-5 sm:p-6" onSubmit={(event) => { if (step < 3) { event.preventDefault(); next(); } }}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="mb-6 block w-full text-sm font-semibold sm:max-w-sm">
        Course
        <Select className="mt-2 font-normal" value={slug} onChange={(event) => switchCourse(event.target.value)} aria-label="Choose a course">
          {choices.map((course) => <option key={course.slug} value={course.slug}>{course.name}</option>)}
        </Select>
      </label>
      <ol className="mb-6 grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.12em] [&>*]:min-w-0">
        {["Student", "Course", "Review"].map((label, index) => <li key={label} className={step === index + 1 ? "rounded-full bg-brand-soft px-2 py-2 text-brand" : "px-2 py-2"}>{index + 1}. {label}</li>)}
      </ol>
      <div className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
        <Field label="Full name" required><Input name="fullName" value={fields.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" /></Field>
        <Field label="Phone number" required><Input name="phone" value={fields.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" inputMode="tel" /></Field>
        <Field label="Email"><Input name="email" type="email" value={fields.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></Field>
        <Field label="Address or city"><Input name="city" value={fields.city} onChange={(event) => update("city", event.target.value)} /></Field>
        <Field label="Previous experience" className="sm:col-span-2"><Textarea name="experience" value={fields.experience} onChange={(event) => update("experience", event.target.value)} /></Field>
      </div>
      <div className={step === 2 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
        <Field label="Intake name"><Input name="intakeName" value={fields.intakeName} onChange={(event) => update("intakeName", event.target.value)} placeholder="Oct 23 Batch" /></Field>
        <Field label="Expected start date"><Input name="expectedStartDate" type="date" value={fields.expectedStartDate} onChange={(event) => update("expectedStartDate", event.target.value)} /></Field>
        <Field label="Additional notes" className="sm:col-span-2"><Textarea name="notes" value={fields.notes} onChange={(event) => update("notes", event.target.value)} /></Field>
      </div>
      <div className={step === 3 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
        <Review label="Name" value={fields.fullName} />
        <Review label="Phone" value={fields.phone} />
        <Review label="Course" value={courseName} />
        <Review label="Intake" value={fields.intakeName || "Not specified"} />
        <Review label="Expected start" value={fields.expectedStartDate || "Not specified"} />
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 sm:col-span-2">
          <input type="checkbox" name="consent" value="yes" checked={fields.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1 h-4 w-4" />
          <span>I understand this is a registration request for Viola Brows and Beauty. It does not confirm payment, a seat, or a start date. <span className="text-brand">*</span></span>
        </label>
      </div>
      {clientError || state.error ? <p className="mt-4 text-sm text-destructive" role="alert">{clientError || state.error}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {step > 1 ? <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
        {step < 3 ? <Button type="button" className="w-full sm:w-auto" onClick={next}>Continue</Button> : <Button type="submit" className="w-full sm:w-auto" disabled={pending || !fields.consent} pendingText="Sending registration...">Submit registration</Button>}
      </div>
    </form>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`block min-w-0 text-sm font-semibold ${className || ""}`}>{label}{required ? <span className="text-brand"> *</span> : null}<span className="mt-2 block font-normal">{children}</span></label>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <p className="min-w-0 text-sm"><span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>{value}</p>;
}
