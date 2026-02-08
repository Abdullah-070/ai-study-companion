"""
AI Service - Gemini integration for transcription, summarization, and tutoring
"""
import google.generativeai as genai
from flask import current_app
from typing import Optional, List, Dict
import json


class AIService:
    """Service for AI-powered features using Google Gemini API."""
    
    def __init__(self):
        self._model: Optional[genai.GenerativeModel] = None
    
    @property
    def model(self) -> genai.GenerativeModel:
        """Lazy initialization of Gemini model."""
        if self._model is None:
            api_key = current_app.config.get('OPENAI_API_KEY')  # Using same env var name for compatibility
            if not api_key:
                raise ValueError("OPENAI_API_KEY (Gemini) not configured")
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel('gemini-pro')
        return self._model
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Note: Gemini doesn't support audio transcription. Use external service or upload as file."""
        raise NotImplementedError("Audio transcription not yet supported with Gemini. Please use manual transcription.")
    
    def summarize_text(self, text: str, max_length: int = 500) -> str:
        """Generate a summary of the given text."""
        prompt = f"""You are an expert summarizer. Create a clear, concise summary of the following content in approximately {max_length} words. Focus on key concepts, main ideas, and important details that would be useful for studying.

Content to summarize:
{text}"""
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards from study content."""
        prompt = f"""You are an expert educator creating flashcards for students. 
Generate exactly {num_cards} flashcards from the provided content.
Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.

Return ONLY a JSON array with objects containing 'front' and 'back' keys, like this format:
[{{"front": "question 1", "back": "answer 1"}}, {{"front": "question 2", "back": "answer 2"}}]

Focus on key concepts, definitions, and important facts.

Content:
{content}"""
        
        try:
            response = self.model.generate_content(prompt)
            content_text = response.text.strip()
            
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
            print(f"Response content: {response.text}")
            return []
    
    def generate_quiz_questions(
        self, 
        content: str, 
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> List[Dict]:
        """Generate quiz questions from study content."""
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
            response = self.model.generate_content(prompt)
            content_text = response.text.strip()
            
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
        """AI tutor chat for concept clarification and study help."""
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
        
        # Build conversation context
        prompt = system_prompt + "\n\n"
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                prompt += f"{role.capitalize()}: {content}\n"
        
        prompt += f"Student: {message}\nTutor:"
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def generate_notes_from_transcription(self, transcription: str) -> str:
        """Generate organized study notes from lecture transcription."""
        prompt = """You are an expert note-taker. Transform the following lecture transcription into well-organized study notes.

Format the notes with:
- Clear headings and subheadings
- Bullet points for key concepts
- Highlighted important terms (use **bold**)
- A brief summary at the end

Make the notes concise but comprehensive, focusing on what would be useful for studying and exam preparation.

Transcription:
""" + transcription
        
        response = self.model.generate_content(prompt)
        return response.text


# Singleton instance
ai_service = AIService()
