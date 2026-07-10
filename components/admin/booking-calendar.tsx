"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";

function renderEventContent(info: EventContentArg) {
  const props = info.event.extendedProps as {
    status?: string;
    paymentStatus?: string;
    bookedBy?: string;
    phone?: string;
  };

  return (
    <div className="overflow-hidden leading-tight">
      <div className="truncate font-semibold">{info.event.title}</div>
      <div className="truncate text-[11px] opacity-90">{props.status} - {props.paymentStatus}</div>
      <div className="truncate text-[11px] opacity-90">By {props.bookedBy}</div>
    </div>
  );
}

export default function BookingCalendar() {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      dayHeaderFormat={{ weekday: "short", month: "short", day: "numeric" }}
      events="/api/admin/calendar-events"
      selectable
      editable={false}
      height="auto"
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
      eventContent={renderEventContent}
      eventDidMount={(info) => {
        const props = info.event.extendedProps;
        info.el.title = [
          info.event.title,
          `Status: ${props.status}`,
          `Payment: ${props.paymentStatus}`,
          `Phone: ${props.phone}`,
          `Booked by: ${props.bookedBy}`,
        ].join("\n");
      }}
      eventClick={(info) => {
        window.location.href = `/admin/bookings/${info.event.id}`;
      }}
    />
  );
}
