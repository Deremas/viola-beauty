"use client";

import { useState } from "react";
import { createStaffRegistration } from "@/app/admin/registrations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function StaffRegistrationForm({ courses, error }: { courses: Array<{ slug: string; name: string }>; error?: string }) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return (
    <form action={createStaffRegistration} className="grid gap-4 rounded-lg border bg-white p-5">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <label className="text-sm font-semibold">Course
        <Select className="mt-2 font-normal" name="slug" required aria-label="Course">
          {courses.map((course) => <option key={course.slug} value={course.slug}>{course.name}</option>)}
        </Select>
      </label>
      <label className="text-sm font-semibold">Full name<Input className="mt-2 font-normal" name="fullName" required /></label>
      <label className="text-sm font-semibold">Phone<Input className="mt-2 font-normal" name="phone" required placeholder="09…" /></label>
      <label className="text-sm font-semibold">Email<Input className="mt-2 font-normal" name="email" type="email" /></label>
      <label className="text-sm font-semibold">City<Input className="mt-2 font-normal" name="city" /></label>
      <label className="text-sm font-semibold">Intake label<Input className="mt-2 font-normal" name="intakeName" placeholder="Optional label only" /></label>
      <label className="text-sm font-semibold">Expected start<Input className="mt-2 font-normal" name="expectedStartDate" type="date" /></label>
      <label className="text-sm font-semibold">Experience<Textarea className="mt-2 font-normal" name="experience" /></label>
      <label className="text-sm font-semibold">Notes<Textarea className="mt-2 font-normal" name="notes" /></label>
      <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" name="consent" value="yes" required /> The student agreed that Viola may keep these details to review the registration.</label>
      <div className="flex justify-end"><Button type="submit">Save registration request</Button></div>
    </form>
  );
}
