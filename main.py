from dotenv import load_dotenv
import os

load_dotenv()  # Load variables from .env

# Retrieve your API key
openai_api_key = os.getenv("OPEN_AI_KEY")

if not openai_api_key:
    raise ValueError("The OPENAI_API_KEY environment variable is not set!")

# Now set your OpenAI API key (if using the openai package)
import openai
openai.api_key = openai_api_key
