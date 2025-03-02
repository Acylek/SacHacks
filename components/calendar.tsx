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

// Sample events data
const events = [
  { id: 1, title: "Team Meeting", date: new Date(2025, 2, 5), type: "work" },
  { id: 2, title: "Doctor Appointment", date: new Date(2025, 2, 10), type: "personal" },
  { id: 3, title: "Project Deadline", date: new Date(2025, 2, 15), type: "work" },
  { id: 4, title: "Birthday Party", date: new Date(2025, 2, 20), type: "personal" },
  { id: 5, title: "Conference", date: new Date(2025, 2, 25), type: "work" },
]

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
          {dayNames.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, i) => {
            const dayEvents = events.filter((event) => isSameDay(event.date, day))

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square p-1 relative rounded-md border border-transparent",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
                  isSameDay(day, selectedDate) && "border-primary",
                  isToday(day) && "bg-muted",
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-xs">{format(day, "d")}</div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-[10px] truncate rounded px-1 py-0.5",
                        event.type === "work" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700",
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected day events */}
        {events.filter((event) => isSameDay(event.date, selectedDate)).length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">{format(selectedDate, "MMMM d, yyyy")}</h3>
            <div className="space-y-2">
              {events
                .filter((event) => isSameDay(event.date, selectedDate))
                .map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-2 rounded-md text-sm",
                      event.type === "work" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700",
                    )}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

