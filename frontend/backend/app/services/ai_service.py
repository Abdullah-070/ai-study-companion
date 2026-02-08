"""
AI Service - OpenAI integration for transcription, summarization, and tutoring
"""
from openai import OpenAI
from flask import current_app
from typing import Optional, List, Dict
import json


class AIService:
    """Service for AI-powered features using OpenAI API."""
    
    def __init__(self):
        self._client: Optional[OpenAI] = None
    
    @property
    def client(self) -> OpenAI:
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            api_key = current_app.config.get('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not configured")
            self._client = OpenAI(api_key=api_key)
        return self._client
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio file using OpenAI Whisper."""
        with open(audio_file_path, 'rb') as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    
    def summarize_text(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of the given text."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert summarizer. Create a clear, concise summary of the following content in approximately {max_length} words. Focus on key concepts, main ideas, and important details that would be useful for studying."
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            max_tokens=max_length * 2,
            temperature=0.3
        )
        return response.choices[0].message.content
    
    def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards from study content."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an expert educator creating flashcards for students. 
                    Generate exactly {num_cards} flashcards from the provided content.
                    Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.
                    Return the flashcards as a JSON array with objects containing 'front' and 'back' keys.
                    Focus on key concepts, definitions, and important facts."""
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            max_tokens=2000,
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get('flashcards', [])
    
    def generate_quiz_questions(
        self, 
        content: str, 
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict]:
        """Generate quiz questions from study content."""
        if question_types is None:
            question_types = ['multiple_choice', 'true_false', 'short_answer']
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an expert educator creating quiz questions for students.
                    Generate exactly {num_questions} questions from the provided content.
                    Use a mix of these question types: {', '.join(question_types)}
                    
                    Return a JSON object with a 'questions' array. Each question should have:
                    - 'question': The question text
                    - 'question_type': One of {question_types}
                    - 'options': Array of 4 options (only for multiple_choice)
                    - 'correct_answer': The correct answer
                    - 'explanation': Brief explanation of why this is correct
                    
                    Make questions that test understanding, not just memorization."""
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            max_tokens=2500,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get('questions', [])
    
    def chat_tutor(
        self, 
        message: str, 
        conversation_history: List[Dict[str, str]] = None,
        subject_context: str = None
    ) -> str:
        """AI tutor chat for concept clarification and study help."""
        messages = [
            {
                "role": "system",
                "content": f"""You are an intelligent, patient, and encouraging study tutor.
                Your role is to help students understand concepts, answer questions, and provide study guidance.
                
                Guidelines:
                - Explain concepts clearly and simply
                - Use examples and analogies when helpful
                - Break down complex topics into smaller parts
                - Encourage critical thinking by asking guiding questions
                - Be supportive and positive
                - If you don't know something, say so honestly
                {"- Current subject context: " + subject_context if subject_context else ""}
                
                Respond in a conversational but educational tone."""
            }
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": message})
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    def generate_notes_from_transcription(self, transcription: str) -> str:
        """Generate organized study notes from lecture transcription."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert note-taker. Transform the following lecture transcription into well-organized study notes.
                    
                    Format the notes with:
                    - Clear headings and subheadings
                    - Bullet points for key concepts
                    - Highlighted important terms (use **bold**)
                    - A brief summary at the end
                    
                    Make the notes concise but comprehensive, focusing on what would be useful for studying and exam preparation."""
                },
                {
                    "role": "user",
                    "content": transcription
                }
            ],
            max_tokens=2000,
            temperature=0.4
        )
        
        return response.choices[0].message.content


# Singleton instance
ai_service = AIService()
