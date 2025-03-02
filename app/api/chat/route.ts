import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { Message } from "ai"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"i 

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json()

  // Process messages to handle PDFs
  const processedMessages = await Promise.all(
    messages.map(async (message) => {
      // If message has PDF attachments, extract text and include it in the message
      if (message.experimental_attachments?.some((a) => a.contentType === "application/pdf")) {
        const pdfAttachments = message.experimental_attachments.filter((a) => a.contentType === "application/pdf")

        // Create a new message with extracted PDF text
        let newContent = message.content as string

        for (const attachment of pdfAttachments) {
          if (attachment.url) {
            try {
              // Fetch the PDF file
              const response = await fetch(attachment.url)
              const pdfBuffer = await response.arrayBuffer()

              // Extract text from PDF using PDFLoader
              const loader = new PDFLoader(new Blob([pdfBuffer]))
              const docs = await loader.load()
              const pdfText = docs.map((doc) => doc.pageContent).join("\n\n")

              // Add PDF content to message
              newContent += `\n\nContent from PDF "${attachment.name || "Uploaded document"}":\n${pdfText}`
            } catch (error) {
              console.error("Error extracting PDF text:", error)
              newContent += `\n\nFailed to extract text from PDF "${attachment.name || "Uploaded document"}".`
            }
          }
        }

        // Return modified message with PDF text included
        return {
          ...message,
          content: newContent,
          // Keep attachments for reference but OpenAI won't process them directly
        }
      }

      // Return original message if no PDFs
      return message
    }),
  )

  // Use OpenAI for all messages
  const result = streamText({
    model: openai("gpt-4o"),
    messages: processedMessages,
  })

  return result.toDataStreamResponse()
}

