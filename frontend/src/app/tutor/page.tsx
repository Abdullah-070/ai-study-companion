'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, Trash2 } from 'lucide-react';
import { tutorApi, subjectsApi } from '@/lib/api';
import { ChatMessage, Subject, ChatSession } from '@/types';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      const [sessionsData, subjectsData] = await Promise.all([
        tutorApi.getSessions(),
        subjectsApi.getAll(),
      ]);
      setSessions(sessionsData);
      setSubjects(subjectsData);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async (sessionId: string) => {
    try {
      const data = await tutorApi.getSession(sessionId);
      setMessages(data.messages);
      setCurrentSessionId(sessionId);
    } catch (err) {
      setError('Failed to load session');
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await tutorApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        startNewSession();
      }
    } catch (err) {
      setError('Failed to delete session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      session_id: currentSessionId || 'temp',
      role: 'user',
      content: userMessage,
      subject_id: selectedSubject,
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, tempUserMessage]);

    try {
      const response = await tutorApi.chat({
        message: userMessage,
        session_id: currentSessionId || undefined,
        subject_id: selectedSubject || undefined,
      });

      setCurrentSessionId(response.session_id);
      setMessages(prev => [...prev.slice(0, -1), 
        { ...tempUserMessage, session_id: response.session_id },
        response.message
      ]);

      // Update sessions list
      if (!currentSessionId) {
        loadInitialData();
      }
    } catch (err) {
      setError('Failed to get response. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Chat History */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button onClick={startNewSession} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.session_id
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => loadSession(session.session_id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {new Date(session.started_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {session.message_count} messages
                </p>
              </div>
              <button
                onClick={(e) => deleteSession(session.session_id, e)}
                className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Bot className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">AI Study Tutor</h1>
                <p className="text-sm text-gray-500">Ask me anything about your studies</p>
              </div>
            </div>
            
            <select
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <Alert type="error" className="m-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-gray-500">
                  Ask me to explain concepts, help with homework, quiz you on topics, 
                  or anything else related to your studies.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    'Explain recursion',
                    'Quiz me on calculus',
                    'What is photosynthesis?',
                    'Help me with essay structure',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="lg">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
