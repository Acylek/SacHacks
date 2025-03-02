"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar } from "./calendar"
import { Event } from "@/types/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Loader2 } from "lucide-react"

// Define a proper interface for chat messages
interface ChatMessage {
  role: string;
  content: string;
  id?: string;
  fileItems?: Array<{
    name: string;
    type: string;
    data: string;
  }>;
}

export function ChatWithCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Update the useState to use this interface
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Custom submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const userMessage = { 
      role: 'user', 
      content: input, 
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` 
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    
    // Clear input field
    setInput('')
    
    // Set loading state
    setIsLoading(true)
    
    try {
      // Call the API directly without the useChat hook
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })
      
      // Handle errors
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      // Get text content
      const responseText = await response.text()
      
      // Create assistant message with guaranteed unique ID
      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
      
      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage])
      
      // Process events from the response
      if (responseText) {
        console.log("AI Response content:", responseText)
        
        // Parse the response for events
        const newEvents = parseEventsFromAI(responseText)
        
        if (newEvents.length > 0) {
          console.log("Successfully parsed events from AI:", newEvents)
          setEvents(prev => {
            const updated = [...prev, ...newEvents]
            console.log("Updated events state:", updated)
            return updated
          })
        } else {
          console.log("No events found in AI response using primary parser")
          
          // Try direct date matching as fallback
          const dateEvents = extractDatesFromText(responseText)
          if (dateEvents.length > 0) {
            console.log("Found dates in response:", dateEvents)
            setEvents(prev => {
              const updated = [...prev, ...dateEvents]
              console.log("Updated events with dates:", updated)
              return updated
            })
          } else {
            console.warn("No events or dates could be extracted from response")
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Sorry, there was an error. Please try again.`,
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Custom handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Custom append function
  const append = async (message: {role: string, content: string, experimental_attachments?: any[]}) => {
    // If there are attachments, handle them
    if (message.experimental_attachments?.length) {
      // Handle file attachments here - this would need to be implemented
      console.log("Handling file attachment")
    }
    
    // Add the message to the chat
    const newMessage = {
      ...message,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // If it's a user message, simulate sending it to the API
    if (message.role === 'user') {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
    
    return newMessage
  }
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      
      // Create a message specifically instructing the AI to extract events
      const uploadMessage = {
        role: 'user',
        content: `I'm uploading a PDF titled "${file.name}". Please extract ALL events, dates, appointments, schedules, and deadlines from this document.`,
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fileItems: [
          {
            name: file.name,
            type: file.type,
            data: base64
          }
        ]
      }
      
      // Add the upload message to chat
      setMessages(prev => [...prev, uploadMessage])
      
      // Call the API with the file data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, uploadMessage].map(m => ({
            role: m.role,
            content: m.content,
            fileItems: m.fileItems
          }))
        })
      })
      
      // Process response
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const responseText = await response.text()
      
      // Add response to chat
      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        id: `file-response-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Process events from the response
      if (responseText) {
        console.log("AI Response content:", responseText)
        
        // Parse the response for events
        const newEvents = parseEventsFromAI(responseText)
        
        if (newEvents.length > 0) {
          console.log("Successfully parsed events from AI:", newEvents)
          setEvents(prev => {
            const updated = [...prev, ...newEvents]
            console.log("Updated events state:", updated)
            return updated
          })
        } else {
          console.log("No events found in AI response using primary parser")
          
          // Try direct date matching as fallback
          const dateEvents = extractDatesFromText(responseText)
          if (dateEvents.length > 0) {
            console.log("Found dates in response:", dateEvents)
            setEvents(prev => {
              const updated = [...prev, ...dateEvents]
              console.log("Updated events with dates:", updated)
              return updated
            })
          } else {
            console.warn("No events or dates could be extracted from response")
          }
        }
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error processing file: ${error instanceof Error ? error.message : String(error)}`,
        id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }])
    } finally {
      setUploadingFile(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // New simpler parsing function that handles a variety of formats
  function parseEventsFromAI(content: string): Event[] {
    try {
      console.log("Parsing AI response:", content);
      
      // Simple pattern matching for "March 3rd" or similar date mentions
      const months = ["january", "february", "march", "april", "may", "june", "july", 
                     "august", "september", "october", "november", "december"];
                       
      const events: Event[] = [];
      const year = new Date().getFullYear();
      
      // Look for month + day patterns
      months.forEach((month, monthIndex) => {
        // Pattern like "March 3rd", "March 3", etc.
        const regex = new RegExp(`${month}\\s+(\\d+)(?:st|nd|rd|th)?`, 'gi');
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const day = parseInt(match[1]);
          if (!isNaN(day) && day >= 1 && day <= 31) {
            // Look for time mentions near this date
            const surroundingText = content.substring(
              Math.max(0, match.index - 30),
              Math.min(content.length, match.index + match[0].length + 30)
            );
            
            // Extract title based on context
            let title = "Busy";
            
            // Check for busy/appointment/meeting keywords
            if (surroundingText.toLowerCase().includes("busy")) {
              title = "Busy";
            } else if (surroundingText.toLowerCase().includes("meeting")) {
              title = "Meeting";
            } else if (surroundingText.toLowerCase().includes("appointment")) {
              title = "Appointment";
            }
            
            // Try to find time
            const timeMatch = surroundingText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
            const date = new Date(year, monthIndex, day);
            
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              const period = timeMatch[3].toLowerCase();
              
              // Convert to 24-hour format
              if (period === 'pm' && hours < 12) hours += 12;
              if (period === 'am' && hours === 12) hours = 0;
              
              date.setHours(hours, minutes);
              title += ` at ${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${period}`;
            }
            
            // Create the event
            events.push({
              id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: title,
              date: date,
              type: surroundingText.toLowerCase().includes("work") ? "work" : "personal"
            });
            
            console.log(`Created event for ${month} ${day}:`, events[events.length - 1]);
          }
        }
        
        // Also check for date ranges like "March 3-5"
        const rangeRegex = new RegExp(`${month}\\s+(\\d+)(?:st|nd|rd|th)?\\s*-\\s*(\\d+)(?:st|nd|rd|th)?`, 'gi');
        
        while ((match = rangeRegex.exec(content)) !== null) {
          const startDay = parseInt(match[1]);
          const endDay = parseInt(match[2]);
          
          if (!isNaN(startDay) && !isNaN(endDay) && 
              startDay >= 1 && startDay <= 31 && 
              endDay >= 1 && endDay <= 31) {
            
            // Create events for each day in the range
            for (let day = startDay; day <= endDay; day++) {
              events.push({
                id: `ai-range-${Date.now()}-${day}-${Math.random().toString(36).substring(2, 9)}`,
                title: "Busy",
                date: new Date(year, monthIndex, day),
                type: "personal"
              });
              
              console.log(`Created range event for ${month} ${day}`);
            }
          }
        }
      });
      
      return events;
    } catch (error) {
      console.error("Error in parseEventsFromAI:", error);
      return [];
    }
  }

  // Additional fallback function to extract dates from text
  function extractDatesFromText(content: string): Event[] {
    try {
      console.log("Extracting dates from text:", content);
      const events: Event[] = [];
      
      // Look for formatted date strings (YYYY-MM-DD)
      const dateRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
      let match;
      
      while ((match = dateRegex.exec(content)) !== null) {
        try {
          const dateStr = match[0];
          const date = new Date(dateStr);
          
          if (!isNaN(date.getTime())) {
            // Get surrounding context for title
            const surroundingText = content.substring(
              Math.max(0, match.index - 50),
              Math.min(content.length, match.index + dateStr.length + 50)
            );
            
            // Default title
            let title = "Event";
            
            // Extract title from context
            const beforeDate = surroundingText.substring(0, surroundingText.indexOf(dateStr)).trim();
            const words = beforeDate.split(/\s+/).filter(w => w.length > 2);
            
            if (words.length > 0) {
              // Take last few words before the date as title
              title = words.slice(Math.max(0, words.length - 3)).join(" ");
            }
            
            // Common event keywords
            if (surroundingText.toLowerCase().includes("busy")) title = "Busy";
            if (surroundingText.toLowerCase().includes("meeting")) title = "Meeting";
            if (surroundingText.toLowerCase().includes("appointment")) title = "Appointment";
            
            events.push({
              id: `date-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: title,
              date: date,
              type: surroundingText.toLowerCase().includes("work") ? "work" : "personal"
            });
            
            console.log(`Created event from date string: ${dateStr}`, events[events.length - 1]);
          }
        } catch (err) {
          console.error("Error processing date match:", err);
        }
      }
      
      return events;
    } catch (error) {
      console.error("Error in extractDatesFromText:", error);
      return [];
    }
  }

  const testEventExtraction = async () => {
    await append({
      role: 'user',
      content: `TEST MESSAGE: Please create the following events directly:
      
1. A work meeting on tomorrow at 2pm
2. A personal appointment on next Friday
3. Mark May 10-15 as busy days

Please format each as Event objects EXACTLY as specified in your instructions.`
    });
  };

  const testSpecificDate = async () => {
    await append({
      role: 'user',
      content: `Make me busy on March 3rd at 3pm for a work meeting.`
    });
  };

  useEffect(() => {
    console.log("Current events state:", events)
  }, [events])

  const addEvents = (newEvents: Event[]) => {
    console.log("Adding events:", newEvents)
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, ...newEvents]
      console.log("Previous events:", prevEvents)
      console.log("Updated events:", updatedEvents)
      return updatedEvents
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[800px]">
      <Card className="w-full md:w-1/2 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle>Chat Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-auto mb-4 border rounded-md p-4 bg-muted/30"
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <p>Upload a PDF or ask about your calendar!</p>
                <p className="text-sm mt-2">Examples:</p>
                <ul className="text-sm mt-1 space-y-1">
                  <li>"I would like February 24-27th to be listed as busy"</li>
                  <li>"Schedule a team meeting on Friday at 2pm"</li>
                  <li>Upload a PDF agenda to add events to your calendar</li>
                </ul>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 p-4 rounded-lg ${
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
          </div>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
          />
          
          <div className="flex gap-2">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Send a message..."
                  className="flex-1 p-2 border rounded-md"
                  disabled={isLoading || uploadingFile}
                />
                <Button type="submit" disabled={isLoading || uploadingFile || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </form>
            
            {/* PDF Upload button */}
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isLoading || uploadingFile}
            >
              {uploadingFile ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UploadCloud className="h-4 w-4 mr-2" />
              )}
              Upload PDF
            </Button>
            
            {/* Test Event button */}
            <Button
              type="button"
              onClick={() => {
                const testDate = new Date()
                const testEvent = {
                  id: `test-${Date.now()}`,
                  title: "Test Event",
                  date: testDate,
                  type: "work" as const
                }
                addEvents([testEvent])
                console.log("Added test event:", testEvent)
              }}
              variant="outline"
              className="bg-green-50"
              disabled={isLoading}
            >
              Test Event
            </Button>
            
            <Button
              type="button"
              onClick={testEventExtraction}
              variant="outline"
              className="bg-yellow-50"
              disabled={isLoading}
            >
              Test Message
            </Button>
            
            <Button
              type="button"
              onClick={testSpecificDate}
              variant="outline"
              className="bg-blue-50"
            >
              Test "March 3rd" Message
            </Button>
          </div>
          
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              <p>Error connecting to AI: {error.message}</p>
              <p className="mt-2">Please check your OPENAI_API_KEY environment variable.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full md:w-1/2">
        <CardHeader className="pb-3">
          <CardTitle>Calendar</CardTitle>
          <div className="text-sm text-muted-foreground">
            {events.length === 0 ? 
              "No events scheduled" : 
              `${events.length} event${events.length === 1 ? '' : 's'} on calendar`
            }
          </div>
        </CardHeader>
        <CardContent>
          <Calendar 
            key={`calendar-${events.length}`} 
            events={events} 
          />
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <div className="mt-6 p-4 border-t">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold">Debug Panel</h3>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => console.log("Current events:", events)}
          >
            Log Events State
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Button 
            size="sm"
            onClick={() => {
              const today = new Date();
              const newEvent = {
                id: `manual-${Date.now()}`,
                title: "Today's Test",
                date: today,
                type: "work" as const
              };
              console.log("Adding manual event:", newEvent);
              setEvents(prevEvents => {
                console.log("Previous events:", prevEvents);
                const updated = [...prevEvents, newEvent];
                console.log("New events array:", updated);
                return updated;
              });
              // Double check after state update
              setTimeout(() => {
                console.log("Events after update:", events);
              }, 100);
            }}
          >
            Add Today's Event
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              // Direct events array for testing
              const directEvents = [
                {
                  id: `direct-1`,
                  title: "Test Event 1",
                  date: new Date(),
                  type: "work" as const
                },
                {
                  id: `direct-2`,
                  title: "Test Event 2",
                  date: new Date(Date.now() + 86400000), // tomorrow
                  type: "personal" as const
                }
              ];
              console.log("Setting direct events:", directEvents);
              setEvents(directEvents);
            }}
          >
            Set Direct Events
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              console.log("Clearing events");
              setEvents([]);
            }}
            variant="destructive"
          >
            Clear Events
          </Button>
        </div>
      </div>
    </div>
  )
} 
