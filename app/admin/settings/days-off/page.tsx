import { prisma } from "@/lib/prisma";
import { createDayOff } from "../actions";
import { shortDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, Td, Th } from "@/components/ui/table";

export default async function DaysOffPage() {
  const daysOff = await prisma.dayOff.findMany({ orderBy: { date: "asc" } });
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
      <Card><CardHeader><CardTitle>Add day off</CardTitle></CardHeader><CardContent>
        <form action={createDayOff} className="grid gap-3">
          <Input name="title" placeholder="Title" required />
          <Input name="date" type="date" required />
          <div className="grid gap-3 sm:grid-cols-2"><Input name="startTime" type="time" /><Input name="endTime" type="time" /></div>
          <Label className="flex items-center gap-2"><input name="isFullDay" type="checkbox" defaultChecked /> Full day</Label>
          <Textarea name="note" placeholder="Note" />
          <Button type="submit">Create unavailable day</Button>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Days off</CardTitle></CardHeader><CardContent className="overflow-x-auto">
        <Table><thead><tr><Th>Title</Th><Th>Date</Th><Th>Full day</Th></tr></thead><tbody>
          {daysOff.map((day) => <tr key={day.id}><Td>{day.title}</Td><Td>{shortDateTime(day.date)}</Td><Td>{day.isFullDay ? "Yes" : "No"}</Td></tr>)}
        </tbody></Table>
      </CardContent></Card>
    </div>
  );
}
