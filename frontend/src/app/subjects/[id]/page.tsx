'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { subjectsApi, lecturesApi } from '@/lib/api';
import { Subject, Lecture } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const subjectData = await subjectsApi.getById(parseInt(subjectId));
        setSubject(subjectData);
        
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
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: subject.color }}>
          {subject.name}
        </h1>
        {subject.description && (
          <p className="text-gray-600 text-lg">{subject.description}</p>
        )}
      </div>

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

      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );
}
