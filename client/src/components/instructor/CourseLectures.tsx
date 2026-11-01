import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import courseService, { CourseDetails } from '../../services/courseService';
import lectureService, { Lecture } from '../../services/lectureService';
import { errorMessage } from '../../services/config';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingSpinner from '../ui/LoadingSpinner';

// Form validation schema (matches server/models/lectureModel.js)
const lectureSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().trim().min(1, 'Please add a description'),
  duration: z
    .number({ invalid_type_error: 'Please enter the length in minutes' })
    .positive('Please enter the length in minutes'),
  isPreview: z.boolean(),
  videoUrl: z.union([z.literal(''), z.string().trim().url('Please enter a full link starting with https://')]),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

type VideoSource = 'link' | 'file';

const MAX_VIDEO_SIZE = 100000000; // 100MB, same as the server limit

const EMPTY_FORM: LectureFormValues = { title: '', description: '', duration: 10, isPreview: false, videoUrl: '' };

const inputClasses =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm';

const CourseLectures: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // The lecture being edited; null means the form adds a new one
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [videoSource, setVideoSource] = useState<VideoSource>('link');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  // Changing the key clears the file input, which React cannot do through state
  const [fileInputKey, setFileInputKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: EMPTY_FORM,
  });

  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    const data = await courseService.getCourseById(courseId);
    if (!data.canManage) {
      throw new Error('You can only manage your own courses.');
    }
    setCourse(data);
  }, [courseId]);

  useEffect(() => {
    loadCourse()
      .catch((err) => setError(errorMessage(err, 'Failed to load the course.')))
      .finally(() => setLoading(false));
  }, [loadCourse]);

  const lectures = course?.lectures || [];

  const clearForm = () => {
    setEditing(null);
    setVideoSource('link');
    setVideoFile(null);
    setFileInputKey((key) => key + 1);
    reset(EMPTY_FORM);
  };

  const startEditing = (lecture: Lecture) => {
    setError('');
    setEditing(lecture);
    setVideoSource('link');
    setVideoFile(null);
    setFileInputKey((key) => key + 1);
    reset({
      title: lecture.title,
      description: lecture.description,
      duration: lecture.duration,
      isPreview: lecture.isPreview,
      videoUrl: '',
    });
    // The form sits below the list, which can be longer than the screen
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_VIDEO_SIZE) {
      setError('The video must be smaller than 100MB.');
      e.target.value = '';
      setVideoFile(null);
      return;
    }
    setError('');
    setVideoFile(file);
  };

  const onSubmit = async (data: LectureFormValues) => {
    if (!courseId) return;
    setError('');

    const hasNewVideo = videoSource === 'file' ? !!videoFile : !!data.videoUrl;
    if (!editing && !hasNewVideo) {
      setError(videoSource === 'file' ? 'Please choose a video file.' : 'Please add a video link.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('duration', String(data.duration));
      formData.append('isPreview', String(data.isPreview));
      if (videoSource === 'file' && videoFile) formData.append('video', videoFile);
      if (videoSource === 'link' && data.videoUrl) formData.append('videoUrl', data.videoUrl);

      if (editing) {
        await lectureService.updateLecture(editing._id, formData);
      } else {
        const lastOrder = lectures.reduce((max, l) => Math.max(max, l.order), 0);
        formData.append('course', courseId);
        formData.append('order', String(lastOrder + 1));
        await lectureService.createLecture(formData);
      }

      await loadCourse();
      clearForm();
    } catch (err) {
      setError(errorMessage(err, 'The lecture could not be saved. Please try again.'));
    }
  };

  const handleDelete = async () => {
    if (!lectureToDelete) return;
    const lecture = lectureToDelete;

    setError('');
    setBusy(true);
    try {
      await lectureService.deleteLecture(lecture._id);
      if (editing?._id === lecture._id) clearForm();
      await loadCourse();
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete the lecture.'));
    } finally {
      setBusy(false);
      setLectureToDelete(null);
    }
  };

  const moveLecture = async (index: number, direction: -1 | 1) => {
    const reordered = [...lectures];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + direction, 0, moved);

    setError('');
    setBusy(true);
    try {
      // Renumber from 1, so lectures that share an order number still move
      await Promise.all(
        reordered.map((lecture, i) => {
          if (lecture.order === i + 1) return null;
          const formData = new FormData();
          formData.append('order', String(i + 1));
          return lectureService.updateLecture(lecture._id, formData);
        })
      );
      await loadCourse();
    } catch (err) {
      setError(errorMessage(err, 'Failed to reorder the lectures.'));
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async () => {
    if (!course) return;
    setError('');
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('published', String(!course.published));
      await courseService.updateCourse(course._id, formData);
      await loadCourse();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update the course.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error || 'Course not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/instructor/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
        &larr; Back to dashboard
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {course.published ? 'Published: students can see this course.' : 'Draft: students cannot see this course yet.'}
          </p>
        </div>
        <Button
          variant={course.published ? 'outline' : 'success'}
          disabled={busy || (!course.published && lectures.length === 0)}
          onClick={togglePublished}
        >
          {course.published ? 'Unpublish' : 'Publish course'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <h2 className="mb-3 text-xl font-semibold text-gray-900">Lectures</h2>
      {lectures.length === 0 ? (
        <div className="mb-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-600">Add your first lecture below, then publish the course.</p>
        </div>
      ) : (
        <ol className="mb-8 space-y-3">
          {lectures.map((lecture, index) => (
            <li
              key={lecture._id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {index + 1}. {lecture.title}
                </p>
                <p className="text-sm text-gray-500">
                  {lecture.duration} min{lecture.isPreview ? ' · Free preview' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || index === 0}
                  onClick={() => moveLecture(index, -1)}
                >
                  <span aria-hidden="true">↑</span>
                  <span className="sr-only">Move {lecture.title} up</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || index === lectures.length - 1}
                  onClick={() => moveLecture(index, 1)}
                >
                  <span aria-hidden="true">↓</span>
                  <span className="sr-only">Move {lecture.title} down</span>
                </Button>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => startEditing(lecture)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" disabled={busy} onClick={() => setLectureToDelete(lecture)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        ref={formRef}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-xl font-semibold text-gray-900">{editing ? 'Edit lecture' : 'Add a lecture'}</h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input id="title" type="text" maxLength={100} {...register('title')} className={inputClasses} />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea id="description" rows={3} {...register('description')} className={inputClasses} />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Length in minutes
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            {...register('duration', { valueAsNumber: true })}
            className={inputClasses}
          />
          {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Video{editing ? ' (leave empty to keep the current one)' : ''}
          </legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="videoSource"
                checked={videoSource === 'link'}
                onChange={() => setVideoSource('link')}
              />
              Video link
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="videoSource"
                checked={videoSource === 'file'}
                onChange={() => setVideoSource('file')}
              />
              Upload a file
            </label>
          </div>

          {videoSource === 'link' ? (
            <div className="mt-3">
              <label htmlFor="videoUrl" className="sr-only">
                Video link
              </label>
              <input
                id="videoUrl"
                type="url"
                placeholder="https://example.com/lecture.mp4"
                {...register('videoUrl')}
                className={inputClasses}
              />
              {errors.videoUrl && <p className="mt-1 text-sm text-red-600">{errors.videoUrl.message}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Use a direct link to a video file, such as an .mp4. YouTube links will not play.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <label htmlFor="video" className="sr-only">
                Video file
              </label>
              <input
                key={fileInputKey}
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Up to 100MB. Uploaded files can be lost when the server restarts, so a link is safer.
              </p>
            </div>
          )}
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register('isPreview')} />
          Free preview: anyone can watch this lecture without enrolling
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editing ? 'Save lecture' : 'Add lecture'}
          </Button>
          {editing && (
            <Button variant="outline" onClick={clearForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={!!lectureToDelete}
        title="Delete this lecture?"
        message={`"${lectureToDelete?.title}" will be removed from the course. This cannot be undone.`}
        confirmLabel="Delete lecture"
        disabled={busy}
        onConfirm={handleDelete}
        onCancel={() => setLectureToDelete(null)}
      />
    </div>
  );
};

export default CourseLectures;
