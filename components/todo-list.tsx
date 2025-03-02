"use client"

import { useState, useEffect } from 'react'
import { CheckSquare, Square, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

// Dynamically import react-confetti to avoid SSR issues
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  date?: Date
}

interface TodoListProps {
  initialTodos?: TodoItem[]
  onTodosChange?: (todos: TodoItem[]) => void
}

export function TodoList({ initialTodos = [], onTodosChange }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  
  // Update todos when initialTodos changes
  useEffect(() => {
    setTodos(initialTodos)
  }, [initialTodos])
  
  // Get window size for confetti
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    // Set initial size
    updateWindowSize()
    
    // Update on resize
    window.addEventListener('resize', updateWindowSize)
    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])
  
  // Update parent component when todos change
  const updateTodos = (newTodos: TodoItem[]) => {
    setTodos(newTodos)
    if (onTodosChange) {
      onTodosChange(newTodos)
    }
  }
  
  const toggleTodo = (id: string) => {
    const newTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    updateTodos(newTodos)
  }
  
  const clearTodos = () => {
    if (todos.length > 0) {
      // Start confetti animation
      setShowConfetti(true)
      
      // Clear all todos
      updateTodos([])
      
      // Stop confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    }
  }
  
  // Calculate progress percentage
  const completedCount = todos.filter(todo => todo.completed).length
  const progressPercentage = todos.length > 0 
    ? Math.round((completedCount / todos.length) * 100) 
    : 0
  
  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>To-Do List</span>
            <span className="text-sm font-normal">
              {completedCount}/{todos.length} completed
            </span>
          </CardTitle>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No tasks yet. Tasks will appear here when extracted from your conversations.
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.map(todo => (
                <li 
                  key={todo.id}
                  className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                  onClick={() => toggleTodo(todo.id)}
                >
                  <button 
                    type="button"
                    className="mt-0.5 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTodo(todo.id);
                    }}
                  >
                    {todo.completed ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={todo.completed ? "line-through text-muted-foreground" : ""}>
                      {todo.text}
                    </p>
                    {todo.date && (
                      <p className="text-xs text-muted-foreground">
                        {todo.date.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {todos.length > 0 && (
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={clearTodos}
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Tasks
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  )
} 