"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Send, FileUp, Loader2 } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [files, setFiles] = useState<FileList | undefined>(undefined)
  const [processingPdf, setProcessingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (input.trim() || files?.length) {
      // Show processing indicator if PDF is being uploaded
      if (files && Array.from(files).some((file) => file.type === "application/pdf")) {
        setProcessingPdf(true)
      }

      await handleSubmit(e, {
        experimental_attachments: files,
      })

      // Reset file input and processing state
      setFiles(undefined)
      setProcessingPdf(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Scroll to bottom after a short delay to allow new message to render
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 100)
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle>Chat Assistant</CardTitle>
      </CardHeader>
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <p>Ask me about your calendar or upload a PDF to discuss!</p>
              <p className="text-sm mt-2">Examples:</p>
              <ul className="text-sm mt-1 space-y-1">
                <li>"What events do I have next week?"</li>
                <li>"Schedule a team meeting on Friday at 2pm"</li>
                <li>"Upload a PDF agenda to add events to my calendar"</li>
              </ul>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "px-4 py-2 rounded-lg max-w-[85%] text-sm",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Display attachments */}
                  {message.experimental_attachments?.map((attachment, index) => (
                    <div key={index} className="mt-2">
                      {attachment.contentType?.startsWith("image/") ? (
                        <Image
                          src={attachment.url || "/placeholder.svg"}
                          alt={attachment.name || `Image ${index}`}
                          width={300}
                          height={200}
                          className="rounded-md object-contain"
                        />
                      ) : attachment.contentType === "application/pdf" ? (
                        <div className="border rounded-md p-2 bg-background">
                          <div className="flex items-center gap-2 text-xs">
                            <FileUp className="h-4 w-4" />
                            <span>{attachment.name || `Document ${index}`}</span>
                          </div>
                          <iframe
                            src={attachment.url}
                            className="w-full h-[200px] mt-2 rounded border"
                            title={attachment.name || `PDF ${index}`}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {(isLoading || processingPdf) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{processingPdf ? "Processing PDF..." : "Thinking..."}</span>
            </div>
          )}
        </div>
      </ScrollArea>
      <CardFooter className="pt-3 flex-col gap-3">
        <Alert variant="outline" className="py-2">
          <AlertDescription className="text-xs">
            Using OpenAI for PDF processing. Text is extracted from PDFs before sending to the model.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input placeholder="Type your message..." value={input} onChange={handleInputChange} className="pr-10" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileUp className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                <span className="sr-only">Upload file</span>
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="application/pdf,image/*"
                onChange={(e) => setFiles(e.target.files || undefined)}
                ref={fileInputRef}
              />
            </div>
          </div>
          <Button type="submit" size="icon" disabled={isLoading || processingPdf}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

