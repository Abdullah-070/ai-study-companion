# AI Study Companion 📚🤖

An intelligent learning assistant that helps students throughout their study journey—from automatically taking notes during live lectures and YouTube videos, to organizing study materials, generating practice questions, and providing personalized test preparation.

## ✨ Features

### 🎥 Lecture Transcription
- Automatically transcribe YouTube video lectures
- Import transcriptions from live lectures
- AI-powered content summarization

### 📝 Smart Notes
- Create and organize study notes by subject
- Generate notes automatically from lecture transcriptions
- AI-powered note summarization

### 🃏 Flashcards
- Generate flashcards automatically from your notes or lectures
- Spaced repetition system for optimal learning
- Track your progress and accuracy

### 🧠 Quiz Generation
- AI-generated practice questions from your study materials
- Multiple question types: multiple choice, true/false, short answer
- Track your quiz attempts and scores

### 💬 AI Tutor
- Interactive chat with an AI study assistant
- Get explanations for difficult concepts
- Personalized help based on your subjects

### 📂 Study Organization
- Organize all materials by subject/course
- Track lecture counts, notes, flashcards, and quizzes per subject

## 🛠️ Technology Stack

### Backend
- **Python 3.11+** with Flask
- **SQLAlchemy** for database ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **Google Gemini API** for AI features

### Frontend
- **Next.js 14** with React
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Google Gemini API key (get it free from [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "AI Study Companion"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the backend server
python run.py
```

The backend will start at `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start at `http://localhost:3000`

## ⚙️ Environment Variables

### Backend (.env)

```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=sqlite:///study_companion.db

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-change-in-production

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
AI Study Companion/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models/              # Database models
│   │   │   ├── __init__.py
│   │   │   └── models.py
│   │   ├── routes/              # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── subjects.py
│   │   │   ├── lectures.py
│   │   │   ├── notes.py
│   │   │   ├── flashcards.py
│   │   │   ├── quizzes.py
│   │   │   └── tutor.py
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py
│   │   │   └── youtube_service.py
│   │   └── utils/               # Helper utilities
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── subjects/
│   │   │   ├── lectures/
│   │   │   ├── notes/
│   │   │   ├── flashcards/
│   │   │   ├── quizzes/
│   │   │   └── tutor/
│   │   ├── components/          # React components
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── lib/                 # Utilities and API client
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── types/               # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## 🔌 API Endpoints

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create a subject
- `PUT /api/subjects/:id` - Update a subject
- `DELETE /api/subjects/:id` - Delete a subject

### Lectures
- `GET /api/lectures` - Get all lectures
- `POST /api/lectures/youtube` - Create from YouTube URL
- `POST /api/lectures/:id/summarize` - Generate summary

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a note
- `POST /api/notes/from-lecture/:id` - Generate from lecture

### Flashcards
- `GET /api/flashcards/sets` - Get all flashcard sets
- `POST /api/flashcards/sets/generate` - AI-generate flashcards
- `POST /api/flashcards/:id/review` - Record review result

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes/generate` - AI-generate quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### AI Tutor
- `POST /api/tutor/chat` - Send chat message
- `POST /api/tutor/ask` - Quick question (no session)
- `GET /api/tutor/sessions` - Get chat sessions

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
npm start
```

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
