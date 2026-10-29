import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import lectureService, { Lecture } from '../../services/lectureService';
import { apiUrl, errorMessage } from '../../services/config';
import LoadingSpinner from '../ui/LoadingSpinner';

const LectureView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | undefined>();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    lectureService
      .getLectureById(id)
      .then((data) => {
        if (!cancelled) setLecture(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err?.response?.status);
        setError(errorMessage(err, 'Failed to load this lecture.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !lecture) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-700">{error || 'Lecture not found.'}</p>
          {status === 401 && (
            <Link to="/login" state={{ from: location.pathname }} className="mt-2 inline-block text-sm font-medium text-primary-600">
              Log in to continue
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to={`/courses/${lecture.course}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
        &larr; Back to course
      </Link>

      <h1 className="mt-2 mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">{lecture.title}</h1>

      {lecture.videoStreamUrl && (
        <video
          key={lecture._id}
          className="mb-6 aspect-video w-full rounded-lg bg-black"
          src={apiUrl(lecture.videoStreamUrl)}
          controls
          controlsList="nodownload"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
      )}

      <p className="mb-6 whitespace-pre-line text-gray-700">{lecture.description}</p>

      {lecture.resources.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Resources</h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {lecture.resources.map((resource) => (
              <li key={resource._id} className="flex items-center justify-between p-3">
                <span className="text-gray-800">{resource.title}</span>
                {resource.downloadUrl && (
                  <a
                    href={apiUrl(resource.downloadUrl)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Download {resource.fileType.toUpperCase()}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default LectureView;
