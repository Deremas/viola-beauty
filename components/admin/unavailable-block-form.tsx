"use client";

import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type BlockKind = "full" | "partial" | "weekly";
type SaveAction = (formData: FormData) => void | Promise<void>;

type DatedBlock = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  note: string;
};

type WeeklyBlock = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export function UnavailableBlockForm({
  createDatedAction,
  createWeeklyAction,
  updateDatedAction,
  updateWeeklyAction,
  deleteDatedAction,
  deleteWeeklyAction,
  timeStepSeconds,
  dated,
  weekly,
  framed = true,
}: {
  createDatedAction: SaveAction;
  createWeeklyAction: SaveAction;
  updateDatedAction: SaveAction;
  updateWeeklyAction: SaveAction;
  deleteDatedAction: SaveAction;
  deleteWeeklyAction: SaveAction;
  timeStepSeconds: number;
  dated?: DatedBlock;
  weekly?: WeeklyBlock;
  framed?: boolean;
}) {
  const isCreate = !dated && !weekly;
  const [kind, setKind] = useState<BlockKind>(weekly ? "weekly" : dated?.isFullDay === false ? "partial" : "full");
  const current: BlockKind = weekly ? "weekly" : kind;
  const action = weekly
    ? updateWeeklyAction
    : dated
      ? updateDatedAction
      : current === "weekly"
        ? createWeeklyAction
        : createDatedAction;

  return (
    <div className={framed ? "rounded-lg border bg-white p-4" : ""}>
      <form action={action} className="grid gap-4">
        {dated ? <input type="hidden" name="id" value={dated.id} /> : null}
        {weekly ? <input type="hidden" name="id" value={weekly.id} /> : null}
        {current !== "weekly" ? <input type="hidden" name="blockKind" value={current} /> : null}

        {weekly ? (
          <p className="text-sm font-semibold">Every week, same hours</p>
        ) : (
          <div>
            <Label className="mb-2 block">Block type</Label>
            <Select value={current} onChange={(event) => setKind(event.target.value as BlockKind)}>
              <option value="full">One date, the whole day</option>
              <option value="partial">One date, part of the day</option>
              {isCreate ? <option value="weekly">Every week, same hours</option> : null}
            </Select>
          </div>
        )}

        {current === "weekly" ? (
          <>
            <div>
              <Label className="mb-2 block">Weekday</Label>
              <Select name="dayOfWeek" defaultValue={String(weekly?.dayOfWeek ?? 1)}>
                {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">From</Label>
                <Input name="startTime" type="time" step={timeStepSeconds} defaultValue={weekly?.startTime || ""} required />
              </div>
              <div>
                <Label className="mb-2 block">Until</Label>
                <Input name="endTime" type="time" step={timeStepSeconds} defaultValue={weekly?.endTime || ""} required />
              </div>
            </div>
            {weekly ? (
              <Label className="flex items-center gap-2">
                <input name="isActive" type="checkbox" defaultChecked={weekly.isActive} />
                Hide these hours every week
              </Label>
            ) : (
              <input type="hidden" name="isActive" value="on" />
            )}
          </>
        ) : (
          <>
            <div>
              <Label className="mb-2 block">Public title</Label>
              <Input name="title" defaultValue={dated?.title || ""} placeholder="Closed for training" required />
            </div>
            <div>
              <Label className="mb-2 block">Date</Label>
              <Input name="date" type="date" defaultValue={dated?.date || ""} required />
            </div>
            {current === "partial" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block">From</Label>
                  <Input name="startTime" type="time" step={timeStepSeconds} defaultValue={dated?.startTime || ""} required />
                </div>
                <div>
                  <Label className="mb-2 block">Until</Label>
                  <Input name="endTime" type="time" step={timeStepSeconds} defaultValue={dated?.endTime || ""} required />
                </div>
              </div>
            ) : null}
            <div>
              <Label className="mb-2 block">Staff note optional</Label>
              <Textarea name="note" defaultValue={dated?.note || ""} placeholder="Visible to staff only" />
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit">{isCreate ? "Save block" : "Save"}</Button>
        </div>
      </form>
      {dated ? (
        <div className="mt-3 flex justify-end border-t pt-3">
          <ConfirmDeleteButton action={deleteDatedAction} id={dated.id} name={dated.title || "this block"} description="Clients will be able to book this date again, except where another block or a booking still applies." />
        </div>
      ) : null}
      {weekly ? (
        <div className="mt-3 flex justify-end border-t pt-3">
          <ConfirmDeleteButton action={deleteWeeklyAction} id={weekly.id} name={`${dayNames[weekly.dayOfWeek]} ${weekly.startTime}–${weekly.endTime}`} description="Those hours will show as bookable again on that weekday, except where a booking still applies." />
        </div>
      ) : null}
    </div>
  );
}
