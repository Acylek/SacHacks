Calendar Assistant
Calendar Assistant is your smart scheduling partner designed to transform your busy schedule into a streamlined, stress-free experience. It seamlessly syncs across devices, intelligently prioritizes appointments, and sends timely reminders so you never miss a beat. Whether you're juggling work meetings or planning personal events, Calendar Assistant learns your habits to optimize your day, giving you more time to focus on what truly matters.

Calendar Assistant Application - Getting Started
This guide will help you install the necessary dependencies to use the AI-powered Calendar Assistant.

Prerequisites
Ensure you have the following prerequisites installed:

Node.js
npm (or yarn)
Dependencies
Core Dependencies
Install the core dependencies with:

bash
Copy
npm install next react react-dom openai date-fns lucide-react
UI Components
Install the UI component dependencies with:

bash
Copy
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
Note: This project uses the shadcn/ui component library. Make sure the core UI dependencies are installed as shown above.

Additional Requirements
API Key
You'll need an OpenAI API key. Add it to your .env.local file:

dotenv
Copy
OPENAI_API_KEY=your_api_key_here
Configure Tailwind CSS
Ensure you have a proper Tailwind CSS setup. Install Tailwind CSS along with PostCSS and Autoprefixer:

bash
Copy
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
After installation, configure Tailwind CSS according to your project needs.
