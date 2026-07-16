import { Check, ClipboardCheck, Trash2 } from "lucide-react";
import { StaffTaskPriority, StaffTaskStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { shortDateTime } from "@/lib/format";
import { StatusBadge } from "@/lib/status";
import { createTask, deleteTask, updateTaskStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default async function TasksPage() {
  await requirePermission("MANAGE_TASKS");
  const [tasks, staff, clients, bookings] = await Promise.all([
    prisma.staffTask.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
        relatedClient: true,
        relatedBooking: { include: { client: true, service: true } },
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.user.findMany({ where: { isActive: true, deletedAt: null, role: { in: [UserRole.ADMIN, UserRole.RECEPTIONIST] } }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" }, take: 200 }),
    prisma.booking.findMany({
      include: { client: true, service: true },
      orderBy: { startDateTime: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Staff tasks</h1>
        <p className="text-sm text-muted-foreground">Assign work to staff and track what is pending, in progress, done, or cancelled.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create task</CardTitle></CardHeader>
        <CardContent>
          <form action={createTask} className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4">
              <Field label="Task title"><Input name="title" placeholder="Call client about payment proof" required /></Field>
              <Field label="Task details"><Textarea name="description" placeholder="What should staff do?" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assign to">
                <Select name="assignedToUserId" defaultValue="">
                  <option value="">Unassigned</option>
                  {staff.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </Select>
              </Field>
              <Field label="Priority">
                <Select name="priority" defaultValue="NORMAL">
                  {Object.values(StaffTaskPriority).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </Select>
              </Field>
              <Field label="Due date"><Input name="dueDate" type="date" /></Field>
              <Field label="Due time"><Input name="dueTime" type="time" /></Field>
              <Field label="Related client">
                <Select name="relatedClientId" defaultValue="">
                  <option value="">No client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.fullName} - {client.phone}</option>)}
                </Select>
              </Field>
              <Field label="Related booking">
                <Select name="relatedBookingId" defaultValue="">
                  <option value="">No booking</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.bookingCode} - {booking.client.fullName} - {booking.service.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit"><ClipboardCheck className="h-4 w-4" />Create task</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Task tracking</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th className="min-w-[18rem]">Task</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Assigned to</Th>
                <Th>Related</Th>
                <Th>Due</Th>
                <Th>Created by</Th>
                <Th className="min-w-[8rem]">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <Td>
                    <div className="font-semibold">{task.title}</div>
                    {task.description ? <div className="mt-1 text-xs text-muted-foreground">{task.description}</div> : null}
                  </Td>
                  <Td><StatusBadge status={task.status} /></Td>
                  <Td>{task.priority}</Td>
                  <Td>{task.assignedTo?.name || "Unassigned"}</Td>
                  <Td>
                    {task.relatedClient ? <div>{task.relatedClient.fullName}</div> : null}
                    {task.relatedBooking ? <div className="text-xs text-muted-foreground">{task.relatedBooking.bookingCode}</div> : null}
                    {!task.relatedClient && !task.relatedBooking ? "None" : null}
                  </Td>
                  <Td>{task.dueAt ? shortDateTime(task.dueAt) : "No due date"}</Td>
                  <Td>{task.createdBy?.name || "System"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <form action={updateTaskStatus}>
                        <input type="hidden" name="id" value={task.id} />
                        <Select name="status" defaultValue={task.status} className="w-36">
                          {Object.values(StaffTaskStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                        </Select>
                        <Button
                          className="mt-2"
                          type="submit"
                          variant="outline"
                          size="icon"
                          title="Update task status"
                          aria-label={`Update status for ${task.title}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <Button type="submit" variant="destructive" size="icon" title="Delete task" aria-label={`Delete ${task.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
              {tasks.length === 0 ? <tr><Td colSpan={8} className="text-center text-muted-foreground">No staff tasks yet.</Td></tr> : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
