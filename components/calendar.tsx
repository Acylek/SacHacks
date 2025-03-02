"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Event } from "@/types/calendar"

// Remove or comment out these static events
// const events = [
//   { id: 1, title: "Team Meeting", date: new Date(2025, 2, 5), type: "work" },
//   { id: 2, title: "Doctor Appointment", date: new Date(2025, 2, 10), type: "personal" },
//   { id: 3, title: "Project Deadline", date: new Date(2025, 2, 15), type: "work" },
//   { id: 4, title: "Birthday Party", date: new Date(2025, 2, 20), type: "personal" },
//   { id: 5, title: "Conference", date: new Date(2025, 2, 25), type: "work" },
// ]

export function Calendar({ events = [] }: { events?: Event[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Add a test event directly in the component for debugging
  const testEvent = {
    id: "test-event",
    title: "Test Calendar Event",
    date: new Date(),
    type: "work" as const
  };

  // Combine props events with test event
  const allEvents = [...events, testEvent];
  
  console.log("Calendar component received events:", events);
  console.log("Calendar test event:", testEvent);
  console.log("Calendar using all events:", allEvents);
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Get days in month
  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  })

  // Get events for this month - use allEvents instead of events
  const eventsThisMonth = allEvents.filter(event => {
    // Ensure event.date is a Date object
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    return isSameMonth(eventDate, currentMonth);
  });
  
  console.log("Events for current month:", eventsThisMonth);

  // Function to get events for a specific day
  const getEventsForDay = (day: Date) => {
    return eventsThisMonth.filter(event => {
      // Ensure event.date is a Date object
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, i) => {
          // Get events for this day
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "h-14 p-1 border rounded-md cursor-pointer transition-colors",
                isToday(day) && "bg-muted",
                isSameDay(day, selectedDate) && "border-primary",
                hasEvents && "border-blue-500 shadow-sm"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex flex-col h-full">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                
                {/* Show event indicators or preview */}
                <div className="mt-auto flex flex-wrap gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className={cn(
                        "w-full text-xs truncate px-1 rounded",
                        event.type === "work" ? "bg-blue-200" : "bg-green-200"
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground w-full text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show events for selected date */}
      <div className="mt-4">
        <h3 className="font-medium">
          Events for {format(selectedDate, "MMMM d, yyyy")}
        </h3>
        <div className="mt-2 space-y-2">
          {getEventsForDay(selectedDate).length > 0 ? (
            getEventsForDay(selectedDate).map((event) => (
              <Card key={event.id} className="p-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "h:mm a")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded",
                      event.type === "work" ? "bg-blue-100" : "bg-green-100"
                    )}
                  >
                    {event.type}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No events scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}

