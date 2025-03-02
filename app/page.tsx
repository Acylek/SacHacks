import { Calendar } from "@/components/calendar"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Calendar Assistant</h1>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6 grid gap-6 md:grid-cols-2 lg:gap-10">
        <Calendar />
        <ChatInterface />
      </main>
    </div>
  )
}

