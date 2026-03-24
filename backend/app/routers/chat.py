import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

SYSTEM_INSTRUCTION = """
You are the AppTechno AI Assistant. Your job is to help students with information about our courses, placements, fees, schedules, and more.
Always be polite, helpful, and concise. Format your answers elegantly using markdown. Do not answer questions outside the scope of AppTechno Software Institute.

KNOWLEDGE BASE:
1. COURSES:
- Full Stack Java Development (Java, Spring Boot, Angular) (~6 months)
- Full Stack Python Development (Python, Django, React) (~6 months)
- MERN Stack Development
- Software Testing & Automation
- Data Analytics (SQL, Power BI, Python)
- Data Science (ML, AI)
* All courses include live project training from IT companies and a 6-month experience certificate!

2. FEES:
- We offer a "Pay 50% After Placement" model. EMI options available. Exact details contact admissions.

3. PLACEMENT:
- 70,000+ students trained & placed since 2000.
- 14 LPA average package.
- Unlimited interviews until placed!

4. ABOUT APPTECHNO:
- Started in 2000. Located in BTM Layout, Bangalore.
- Tagline: "AI Inside. Innovation Outside."

5. SCHEDULE & BATCHES:
- Weekday (Mon-Fri) and Weekend (Sat-Sun) batches available. Classroom, Online, and Hybrid modes.

6. ATTENDANCE & LEAVES:
- Students punch in/out using QR scan. Record multiple punches. Dashboard handles leave requests.
- Dashboard allows viewing total logged institute hours.
"""

@router.post("")
async def chat_with_ai(payload: ChatMessage):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"response": "I'm sorry, but my AI brain is currently offline. Please configure the `GEMINI_API_KEY` in the server `.env` file! To request an API key, go to Google AI Studio."}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_INSTRUCTION)
        
        # Format history for Gemini ensuring strict role mappings
        formatted_history = []
        for msg in payload.history:
            role = "user" if msg.get("role") == "user" else "model"
            # simple validation, model needs the text in 'parts'
            text = msg.get("text", "")
            if text:
                formatted_history.append({"role": role, "parts": [text]})
                
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(payload.message)
        
        return {"response": response.text}
    except Exception as e:
        return {"response": f"Oops! I encountered an AI processing error: {str(e)}"}
