'use client';

import { useState, useEffect } from 'react';
import { Plus, Youtube, BookOpen, FileText, Sparkles, Upload } from 'lucide-react';
import { lecturesApi, subjectsApi } from '@/lib/api';
import { Lecture, Subject } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import CardMenu from '@/components/ui/CardMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingPage, LoadingCard } from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { formatDate, formatDuration, truncateText } from '@/lib/utils';

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'youtube' | 'manual' | 'audio' | 'file'>('youtube');
  const [manualUploadType, setManualUploadType] = useState<'text' | 'audio' | 'file'>('text');
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    subject_id: '',
    transcription: '',
    generate_summary: true,
  });
  const [editData, setEditData] = useState({ title: '', transcription: '' });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lecturesData, subjectsData] = await Promise.all([
        lecturesApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setLectures(lecturesData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'youtube' | 'manual' | 'audio' | 'file', uploadType?: 'text' | 'audio' | 'file') => {
    setModalType(type);
    if (uploadType) setManualUploadType(uploadType);
    setFormData({
      title: '',
      url: '',
      subject_id: subjects[0]?.id.toString() || '',
      transcription: '',
      generate_summary: true,
    });
    setAudioFile(null);
    setDocFile(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setEditData({ title: lecture.title, transcription: lecture.transcription || '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSubmitting(true);
      const updated = await lecturesApi.update(editingId, editData);
      setLectures(lectures.map(l => l.id === editingId ? updated : l));
      setIsEditModalOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update lecture');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    
    try {
      await lecturesApi.delete(id);
      setLectures(lectures.filter(l => l.id !== id));
    } catch (err) {
      setError('Failed to delete lecture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) return;

    try {
      setSubmitting(true);
      let newLecture: Lecture;

      if (modalType === 'youtube') {
        newLecture = await lecturesApi.createFromYouTube({
          url: formData.url,
          subject_id: parseInt(formData.subject_id),
          title: formData.title || undefined,
          generate_summary: formData.generate_summary,
        });
      } else if (modalType === 'manual') {
        if (manualUploadType === 'audio') {
          if (!audioFile) {
            setError('Please select an audio file');
            return;
          }
          newLecture = await lecturesApi.uploadAudio({
            file: audioFile,
            title: formData.title,
            subject_id: parseInt(formData.subject_id),
            generate_summary: formData.generate_summary,
          });
        } else if (manualUploadType === 'file') {
          if (!docFile) {
            setError('Please select a document file');
            return;
          }
          newLecture = await lecturesApi.uploadDocument({
            file: docFile,
            title: formData.title,
            subject_id: parseInt(formData.subject_id),
            generate_summary: formData.generate_summary,
          });
        } else {
          // text
          newLecture = await lecturesApi.createManualTranscription({
            title: formData.title,
            subject_id: parseInt(formData.subject_id),
            transcription: formData.transcription,
            generate_summary: formData.generate_summary,
          });
        }
      } else {
        newLecture = await lecturesApi.createManualTranscription({
          title: formData.title,
          subject_id: parseInt(formData.subject_id),
          transcription: formData.transcription,
          generate_summary: formData.generate_summary,
        });
      }

      setLectures([newLecture, ...lectures]);
      setIsModalOpen(false);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to create lecture';
      if (err.suggestion) {
        errorMessage += `\n\n💡 Tip: ${err.suggestion}`;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lectures</h1>
          <p className="text-gray-500 mt-1">Transcribe and organize your lecture content</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => openModal('youtube')}>
            <Youtube className="h-4 w-4 mr-2" />
            From YouTube
          </Button>
          <div className="relative group">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Manual Upload
              <span className="ml-2">▼</span>
            </Button>
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => openModal('manual', 'text')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md border-b border-gray-100"
              >
                <span className="font-medium">📝 Paste Text</span>
                <div className="text-xs text-gray-500">Paste transcription directly</div>
              </button>
              <button
                onClick={() => openModal('manual', 'audio')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <span className="font-medium">🎵 Upload Audio</span>
                <div className="text-xs text-gray-500">MP3, WAV, M4A, OGG, FLAC, WebM</div>
              </button>
              <button
                onClick={() => openModal('manual', 'file')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-md"
              >
                <span className="font-medium">📄 Upload Document</span>
                <div className="text-xs text-gray-500">PDF, DOCX, PPTX files</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {subjects.length === 0 && (
        <Alert type="warning" className="mb-6">
          You need to create a subject first before adding lectures.{' '}
          <Link href="/subjects" className="underline font-medium">Create a subject</Link>
        </Alert>
      )}

      {/* Lectures List */}
      {lectures.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lectures yet</h3>
          <p className="text-gray-500 mb-4">Add a YouTube video or paste a transcription to get started</p>
          {subjects.length > 0 && (
            <Button onClick={() => openModal('youtube')}>
              <Youtube className="h-4 w-4 mr-2" />
              Add YouTube Video
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <div key={lecture.id}>
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      {lecture.source_type === 'youtube' ? (
                        <Youtube className="h-6 w-6 text-red-500" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                    <Link href={`/lectures/${lecture.id}`} className="flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{lecture.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{lecture.subject_name}</span>
                              {lecture.duration_seconds && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(lecture.duration_seconds)}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatDate(lecture.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        {lecture.summary && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full mt-2">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Summarized
                          </span>
                        )}
                      </div>
                      {lecture.summary && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {truncateText(lecture.summary, 200)}
                        </p>
                      )}
                    </Link>
                    <div className="ml-auto pl-4">
                      <CardMenu
                        onEdit={() => handleEditOpen(lecture)}
                        onDelete={() => handleDelete(lecture.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add Lecture Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'youtube'
            ? 'Add YouTube Lecture'
            : modalType === 'audio'
            ? 'Upload Audio Lecture'
            : 'Add Lecture Manually'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {modalType === 'youtube' ? (
            <>
              <Input
                label="YouTube URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
              <Input
                label="Title (optional)"
                placeholder="Auto-detected from video"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.generate_summary}
                  onChange={(e) => setFormData({ ...formData, generate_summary: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Generate AI summary</span>
              </label>
            </>
          ) : modalType === 'manual' ? (
            <>
              <Input
                label="Title"
                placeholder="Lecture title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              
              {manualUploadType === 'text' && (
                <Textarea
                  label="Transcription"
                  placeholder="Paste your lecture transcription here..."
                  value={formData.transcription}
                  onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                  rows={8}
                  required
                />
              )}
              
              {manualUploadType === 'audio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio File (WAV, MP3, M4A, OGG, FLAC, WebM)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                    required
                  />
                </div>
              )}
              
              {manualUploadType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document File (PDF, DOCX, PPTX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.pptx,.ppt"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    We'll extract text from the document and create a transcription.
                  </p>
                </div>
              )}
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.generate_summary}
                  onChange={(e) => setFormData({ ...formData, generate_summary: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Generate AI summary</span>
              </label>
            </>
          ) : (
            <>
              <Input
                label="Title"
                placeholder="Lecture title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                label="Transcription"
                placeholder="Paste your lecture transcription here..."
                value={formData.transcription}
                onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                rows={8}
                required
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.generate_summary}
                  onChange={(e) => setFormData({ ...formData, generate_summary: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Generate AI summary</span>
              </label>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? modalType === 'youtube'
                  ? 'Processing...'
                  : modalType === 'audio'
                  ? 'Transcribing...'
                  : 'Creating...'
                : modalType === 'youtube'
                ? 'Import & Transcribe'
                : modalType === 'audio'
                ? 'Upload & Transcribe'
                : 'Create Lecture'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lecture"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
          <Input
            label="Title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            required
          />
          <Textarea
            label="Transcription"
            value={editData.transcription}
            onChange={(e) => setEditData({ ...editData, transcription: e.target.value })}
            rows={10}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
