import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Layers,
  Brain,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Lecture Transcription',
    description: 'Automatically transcribe lectures from YouTube videos or live recordings',
    href: '/lectures',
    color: 'bg-blue-500',
  },
  {
    icon: FileText,
    title: 'Smart Notes',
    description: 'AI-generated notes from your lectures with summaries and key points',
    href: '/notes',
    color: 'bg-green-500',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description: 'Generate flashcards automatically from your study materials',
    href: '/flashcards',
    color: 'bg-amber-500',
  },
  {
    icon: Brain,
    title: 'Practice Quizzes',
    description: 'Test your knowledge with AI-generated quizzes',
    href: '/quizzes',
    color: 'bg-purple-500',
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor',
    description: 'Get personalized help and explanations from your AI study assistant',
    href: '/tutor',
    color: 'bg-pink-500',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered{' '}
            <span className="text-primary-600">Study Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your learning experience with automatic note-taking, 
            smart flashcards, practice quizzes, and personalized AI tutoring.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/subjects"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/tutor"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Talk to AI Tutor
              <MessageSquare className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Everything You Need to Study Smarter
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.color} text-white mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats / Info */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Add Your Content</h3>
              <p className="text-gray-600 text-sm">
                Upload lectures, paste YouTube URLs, or create notes manually
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">AI Processes It</h3>
              <p className="text-gray-600 text-sm">
                Our AI transcribes, summarizes, and organizes your materials
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Study & Learn</h3>
              <p className="text-gray-600 text-sm">
                Review notes, practice with flashcards, and test with quizzes
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
