import os
import io
import json
import PyPDF2
import google.generativeai as genai

# Setup Gemini API KEY
# Prioritize env, fallback to provided key for testing.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCPUNpoDBhzMYcn2OZc1GL-9ZzPfzQPWnw")

genai.configure(api_key=GEMINI_API_KEY)

# Use the flexible instruction-following model
MODEL_NAME = 'gemini-1.5-flash'


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from a PDF byte array."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
        return "\n".join(extracted_text)
    except Exception as e:
        print(f"[AI Grader] Error parsing PDF: {e}")
        return ""


def generate_assignment_instructions(topic: str) -> str:
    """
    Generates structured assignment instructions based on a topic string.
    """
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction="You are a senior tech lead designing a challenging, real-world assignment for trainees. Output ONLY clean markdown format. Include Prerequisites, Objective, Constraints, and Grading Criteria. Keep it under 500 words."
        )
        response = model.generate_content(f"Create an assignment purely based on this topic/command: {topic}")
        return response.text
    except Exception as e:
        print(f"[AI Grader] Error generating assignment: {e}")
        return "Failed to generate instructions. Please try manually uploading a PDF."


def evaluate_submission(assignment_instructions: str, student_content: str, max_marks: int = 100) -> dict:
    """
    Evaluates a student's submission text/code against the assignment requirements.
    Returns a dict with `score` (integer) and `feedback` (str).
    """
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=(
                f"You are a strict, helpful coding instructor grading an assignment. "
                f"The maximum score is {max_marks}. "
                f"Return ONLY a strictly valid JSON object with EXACTLY two keys: 'score' (an integer) and 'feedback' (a string). "
                f"Do NOT wrap it in markdown block quotes. Do NOT return anything else."
            )
        )
        
        prompt = f"### ASSIGNMENT INSTRUCTIONS:\n{assignment_instructions}\n\n### STUDENT SUBMISSION:\n{student_content}\n\nEvaluate the student submission."
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        result_json = json.loads(response.text)
        return {
            "score": int(result_json.get("score", 0)),
            "feedback": result_json.get("feedback", "No feedback provided by AI.")
        }
    except Exception as e:
        print(f"[AI Grader] Error grading submission: {e}")
        return {
            "score": 0,
            "feedback": "AI Evaluation failed. Please grade manually."
        }
