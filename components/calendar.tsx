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

  // Remove the test event - we want to use the actual events passed from the parent
  // const testEvent = {
  //   id: "test-event",
  //   title: "Test Calendar Event",
  //   date: new Date(),
  //   type: "work" as const
  // };

  // Use only the events passed as props
  const allEvents = [...events];
  
  console.log("Calendar component received events:", events);
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Get days in month
  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  })

  // Filter events for the current month
  const eventsThisMonth = allEvents.filter(event => {
    // Ensure we're working with Date objects
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    
    // Debug what's happening with dates
    console.log("Comparing event date:", eventDate, "with month:", currentMonth);
    
    // Check if month and year match the current view
    return eventDate.getMonth() === currentMonth.getMonth() && 
           eventDate.getFullYear() === currentMonth.getFullYear();
  });
  
  console.log("Events for current month:", eventsThisMonth);

  return (
    <Card>
      <CardHeader className="space-y-1 flex flex-row items-center justify-between">
        <CardTitle>Calendar</CardTitle>
        <div className="flex gap-1">
          <Button onClick={prevMonth} variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={nextMonth} variant="outline" size="icon" className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-9" />
          ))}
          {daysInMonth.map((day) => {
            // Find events for this day
            const dayEvents = eventsThisMonth.filter(event => {
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              return isSameDay(eventDate, day);
            });
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  "h-9 flex flex-col items-center justify-center rounded-md text-xs relative",
                  isToday(day) && "bg-accent text-accent-foreground font-medium",
                  isSameDay(day, selectedDate) && "border border-primary"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <span>{format(day, "d")}</span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          event.type === "work" ? "bg-blue-500" : "bg-green-500"
                        )}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {Array.from({
            length: 6 - lastDayOfMonth.getDay(),
          }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-9" />
          ))}
        </div>
        
        {/* Display events for selected date */}
        <div className="mt-4 space-y-1">
          <div className="text-xs font-medium">
            {format(selectedDate, "MMMM d, yyyy")}
          </div>
          {eventsThisMonth
            .filter(event => {
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              return isSameDay(eventDate, selectedDate);
            })
            .map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded-md text-xs",
                  event.type === "work" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-[10px] opacity-80">
                  {event.date instanceof Date 
                    ? format(event.date, "h:mm a") 
                    : format(new Date(event.date), "h:mm a")}
                </div>
              </div>
            ))}
          {eventsThisMonth.filter(event => {
            const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
            return isSameDay(eventDate, selectedDate);
          }).length === 0 && (
            <div className="text-xs text-muted-foreground">No events</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

