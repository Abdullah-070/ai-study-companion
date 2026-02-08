'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { subjectsApi, lecturesApi } from '@/lib/api';
import { Subject, Lecture } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const subjectData = await subjectsApi.getById(parseInt(subjectId));
        setSubject(subjectData);
        setEditData({ name: subjectData.name, description: subjectData.description || '' });
        
        const lecturesData = await lecturesApi.getAll(parseInt(subjectId));
        setLectures(lecturesData);
        setError('');
      } catch (err) {
        setError('Failed to load subject');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const handleEdit = async () => {
    try {
      setSubmitting(true);
      const updated = await subjectsApi.update(parseInt(subjectId), editData);
      setSubject(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this subject? This cannot be undone.')) {
      return;
    }
    try {
      await subjectsApi.delete(parseInt(subjectId));
      router.push('/subjects');
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading subject...</p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="p-8">
        <Alert type="error">{error || 'Subject not found'}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: subject.color }}>
              {subject.name}
            </h1>
            {subject.description && (
              <p className="text-gray-600 text-lg">{subject.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="secondary"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Lectures ({lectures.length})</h2>
        {lectures.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No lectures yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lectures.map((lecture) => (
              <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <h3 className="font-semibold mb-2">{lecture.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {lecture.source_type === 'youtube' ? '▶️ YouTube' : '📝 Manual'}
                  </p>
                  {lecture.summary && (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {lecture.summary}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => router.back()}>Go Back</Button>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Subject"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="p-6 space-y-4">
          <Input
            label="Subject Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            rows={4}
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
