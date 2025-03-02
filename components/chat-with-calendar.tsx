"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar } from "./calendar"
import { Event } from "@/types/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Loader2, Send } from "lucide-react"
import { TodoList } from "./todo-list"
import { Textarea } from "@/components/ui/textarea"

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

// Define an interface for todo items
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date?: Date
}

export function ChatWithCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const [todos, setTodos] = useState<TodoItem[]>([])

  // Handle todos changes
  const handleTodosChange = (newTodos: TodoItem[]) => {
    setTodos(newTodos)
  }

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Send message function
  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      role: 'user',
      content: input,
      id: Date.now().toString()
    }

    // Update UI immediately with user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Call your API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Get text response instead of trying to parse JSON
      const text = await response.text()
      
      // Add AI response to messages
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: text,
        id: Date.now().toString()
      }])
      
      // Process the text to extract events and todos
      const extractedEvents = parseEventsFromText(text)
      if (extractedEvents.length > 0) {
        setEvents(prev => [...prev, ...extractedEvents])
      }
      
      const extractedTodos = extractTodosFromText(text)
      if (extractedTodos.length > 0) {
        setTodos(prev => [...prev, ...extractedTodos])
      }
      
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  // Add these helper functions to extract data from text
  function parseEventsFromText(text: string): Event[] {
    const events: Event[] = []
    // Update pattern to capture our event format better
    const eventPattern = /I've added "([^"]+)" to your calendar(?:\s+(?:on|for)\s+([A-Za-z]+ \d+(?:st|nd|rd|th)?(?:,? \d{4})?))?(?: at (\d+(?::\d+)?\s*(?:am|pm)?))?/gi
    
    let match
    while ((match = eventPattern.exec(text)) !== null) {
      const title = match[1]
      const dateStr = match[2] || 'today'
      const timeStr = match[3] || ''
      
      console.log("Event match:", { title, dateStr, timeStr });
      
      // Parse the date with current year by default
      let dateObj = new Date(); // Start with today
      const currentYear = new Date().getFullYear();
      
      try {
        if (dateStr.toLowerCase() !== 'today') {
          // Handle various date formats
          const normalizedDateStr = dateStr
            .replace(/(st|nd|rd|th),?/g, '')  // Remove ordinals
            .trim();
            
          console.log("Normalized date string:", normalizedDateStr);
          
          // Check if year is specified in the date string
          const hasYear = /\d{4}/.test(normalizedDateStr);
          
          // Add current year if not specified
          const dateWithYear = hasYear ? normalizedDateStr : `${normalizedDateStr}, ${currentYear}`;
          console.log("Date with year:", dateWithYear);
          
          // Try to parse the date
          const parsedDate = new Date(dateWithYear);
          if (!isNaN(parsedDate.getTime())) {
            dateObj = parsedDate;
          }
        }
        
        // Handle time part
        if (timeStr) {
          const timeMatch = /(\d+)(?::(\d+))?\s*(am|pm)?/i.exec(timeStr);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1], 10);
            const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            const isPM = timeMatch[3]?.toLowerCase() === 'pm';
            
            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
            
            dateObj.setHours(hour, minute, 0, 0);
          }
        }
        
        console.log("Final parsed date:", dateObj);
        
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title,
          date: dateObj,
          type: 'work'
        });
        
        console.log("Added event:", { title, date: dateObj });
      } catch (err) {
        console.error("Error parsing date:", err);
      }
    }
    
    return events;
  }

  function extractTodosFromText(text: string): TodoItem[] {
    const todos: TodoItem[] = []
    const todoPattern = /Todo: (.*?)(?:\n|$)/g
    const currentYear = new Date().getFullYear();
    
    let match
    while ((match = todoPattern.exec(text)) !== null) {
      const todoText = match[1].trim()
      
      // Extract date from todo text if present (e.g., "on March 5th")
      let todoDate = undefined
      const dateMatch = todoText.match(/on ([A-Za-z]+ \d+(?:st|nd|rd|th)?)/i)
      
      if (dateMatch) {
        // Remove ordinals and add current year
        const dateStr = dateMatch[1].replace(/(st|nd|rd|th)/g, '').trim() + `, ${currentYear}`;
        const parsedDate = new Date(dateStr);
        
        if (!isNaN(parsedDate.getTime())) {
          todoDate = parsedDate;
        }
      }
      
      todos.push({
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: todoText,
        completed: false,
        date: todoDate
      })
      
      console.log("Added todo:", { text: todoText, date: todoDate });
    }
    
    return todos
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingFile(true);
    
    // Add the file to the chat message
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      const userMessage = {
        role: 'user',
        content: `I've uploaded a file: ${file.name}`,
        id: Date.now().toString(),
        fileItems: [{
          name: file.name,
          type: file.type,
          data: reader.result as string
        }]
      };
      
      setMessages(prev => [...prev, userMessage]);
      setUploadingFile(false);
    };
    
    reader.onerror = () => {
      setError(new Error('Failed to read file'));
      setUploadingFile(false);
    };
    
    // Read the file
    if (file.type.includes('image')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  }

  // Trigger file input
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Chat with Your Calendar Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat messages container */}
          <div 
            ref={chatContainerRef}
            className="h-[400px] overflow-y-auto border rounded-md p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Start a conversation with your calendar assistant
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleUploadClick}
              disabled={isLoading}
            >
              <UploadCloud className="h-5 w-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              <Send className="h-5 w-5 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Calendar events={events} />
        <TodoList initialTodos={todos} onTodosChange={handleTodosChange} />
      </div>
    </div>
  )
}
