import { OpenAI } from "openai";

// Create the OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// System message to format events consistently
const systemMessage = {
  role: "system",
  content: `You are a calendar assistant that helps users manage their schedule.
When users mention dates or request events to be added to the calendar, please respond conversationally, mentioning dates clearly.
When analyzing PDF content, extract any meetings, appointments, deadlines, or scheduled events with their dates and times.`
};

// Interface for chat messages
interface ChatMessage {
  role: string;
  content: string;
  fileItems?: Array<{
    name: string;
    type: string;
    data: string;
  }>;
}

export async function POST(req: Request) {
  try {
    console.log("Chat API route called");
    
    const body = await req.json();
    const messages = body.messages || [];
    
    console.log("Received messages:", messages.length);
    
    // Process messages to handle PDFs
    const processedMessages = await Promise.all(
      messages.map(async (message: ChatMessage) => {
        if (message.fileItems?.some(file => file.type === "application/pdf")) {
          console.log("Processing PDF attachment");
          
          try {
            // Extract PDF name for context
            const pdfFile = message.fileItems.find(file => file.type === "application/pdf");
            if (!pdfFile) return message;
            
            // Just add context about the PDF
            let newContent = message.content || "";
            newContent += `\n\nNote: I've uploaded a PDF file named "${pdfFile.name}". Please analyze it for any events, meetings, appointments, or deadlines.`;
            
            return {
              ...message,
              content: newContent
            };
          } catch (error) {
            console.error("Error processing PDF:", error);
            return message;
          }
        }
        return message;
      })
    );
    
    // Prepare messages for OpenAI
    const apiMessages = [
      systemMessage,
      ...processedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    console.log("Calling OpenAI with processed messages");
    
    // Call OpenAI API without streaming
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages,
      temperature: 0.7,
    });
    
    console.log("Got response from OpenAI");
    
    // Just return the text content
    return new Response(completion.choices[0].message.content, {
      headers: {
        "Content-Type": "text/plain"
      }
    });
    
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response("Error: " + (error as Error).message, { 
      status: 500,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
}

