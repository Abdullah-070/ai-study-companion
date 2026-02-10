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
            base_url = current_app.config.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')
            if not api_key:
                print("ERROR: OPENAI_API_KEY not found in config")
                print(f"Available config keys: {list(current_app.config.keys())}")
                raise ValueError("OPENAI_API_KEY not configured in Flask app config")
            try:
                # Initialize OpenAI client with custom base URL (for OpenRouter or other providers)
                self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=30.0)
            except TypeError as e:
                if 'proxies' in str(e):
                    # Fallback: use environment variable directly
                    import os
                    self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=30.0)
                else:
                    raise
        return self._client
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio using OpenAI Whisper API."""
        try:
            with open(audio_file_path, 'rb') as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text
        except Exception as e:
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def summarize_text(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of the given text using OpenAI."""
        prompt = f"""You are an expert summarizer. Create a clear, concise summary of the following content in approximately {max_length} words. Focus on key concepts, main ideas, and important details that would be useful for studying.

Content to summarize:
{text}"""
        
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content
    
    def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards from study content using OpenAI."""
        prompt = f"""You are an expert educator creating flashcards for students. 
Generate exactly {num_cards} flashcards from the provided content.
Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.

Return ONLY a JSON array with objects containing 'front' and 'back' keys, like this format:
[{{"front": "question 1", "back": "answer 1"}}, {{"front": "question 2", "back": "answer 2"}}]

Focus on key concepts, definitions, and important facts.

Content:
{content}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            content_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from the response
            if content_text.startswith('['):
                result = json.loads(content_text)
            else:
                # Try to find JSON array in the response
                start = content_text.find('[')
                end = content_text.rfind(']') + 1
                if start >= 0 and end > start:
                    result = json.loads(content_text[start:end])
                else:
                    print(f"Could not find JSON in response: {content_text}")
                    return []
            
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and 'flashcards' in result:
                return result.get('flashcards', [])
            else:
                return result if isinstance(result, list) else []
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response content: {content_text}")
            return []
    
    def generate_quiz_questions(
        self, 
        content: str, 
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict]:
        """Generate quiz questions from study content using OpenAI."""
        if question_types is None:
            question_types = ['multiple_choice', 'true_false', 'short_answer']
        
        prompt = f"""You are an expert educator creating quiz questions for students.
Generate exactly {num_questions} questions from the provided content.
Use a mix of these question types: {', '.join(question_types)}

Return ONLY a JSON object with a 'questions' array. Each question should have:
- 'question': The question text
- 'question_type': One of {question_types}
- 'options': Array of 4 options (only for multiple_choice)
- 'correct_answer': The correct answer
- 'explanation': Brief explanation of why this is correct

Make questions that test understanding, not just memorization.

Content:
{content}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            content_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from the response
            start = content_text.find('{')
            end = content_text.rfind('}') + 1
            if start >= 0 and end > start:
                result = json.loads(content_text[start:end])
            else:
                print(f"Could not find JSON in response: {content_text}")
                return []
            
            return result.get('questions', [])
        except json.JSONDecodeError as e:
            print(f"JSON decode error in quiz generation: {e}")
            return []
    
    def chat_tutor(
        self, 
        message: str, 
        conversation_history: List[Dict[str, str]] = None,
        subject_context: str = None
    ) -> str:
        """AI tutor chat for concept clarification and study help using OpenAI."""
        system_prompt = f"""You are an intelligent, patient, and encouraging study tutor.
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
        
        # Build messages for the API
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
        
        # Add the current message
        messages.append({"role": "user", "content": message})
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Tutor chat failed: {str(e)}")
    
    def generate_notes_from_transcription(self, transcription: str) -> str:
        """Generate organized study notes from lecture transcription using OpenAI."""
        prompt = """You are an expert note-taker. Transform the following lecture transcription into well-organized study notes.

Format the notes with:
- Clear headings and subheadings
- Bullet points for key concepts
- Highlighted important terms (use **bold**)
- A brief summary at the end

Make the notes concise but comprehensive, focusing on what would be useful for studying and exam preparation.

Transcription:
""" + transcription
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Note generation failed: {str(e)}")


# Singleton instance
ai_service = AIService()
