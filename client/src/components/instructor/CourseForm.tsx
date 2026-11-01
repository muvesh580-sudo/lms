import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import courseService, { COURSE_CATEGORIES, COURSE_LEVELS } from '../../services/courseService';
import { errorMessage, thumbnailUrl } from '../../services/config';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

// Form validation schema (matches server/models/courseModel.js)
const courseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  price: z
    .number({ invalid_type_error: 'Please enter a price (0 for a free course)' })
    .min(0, 'Price cannot be negative'),
  category: z.enum(COURSE_CATEGORIES),
  level: z.enum(COURSE_LEVELS),
  duration: z.string().trim().min(1, 'Please add a duration, for example 6 hours'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const MAX_THUMBNAIL_SIZE = 5000000; // 5MB, same as the server limit

const inputClasses =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm';

const CourseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: 'Web Development',
      level: 'Beginner',
      duration: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    courseService
      .getCourseById(id)
      .then((course) => {
        if (cancelled) return;
        if (!course.canManage) {
          setError('You can only edit your own courses.');
          return;
        }
        reset({
          title: course.title,
          description: course.description,
          price: course.price,
          category: course.category as CourseFormValues['category'],
          level: course.level as CourseFormValues['level'],
          duration: course.duration,
        });
        setCurrentThumbnail(course.thumbnail);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Failed to load the course.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_THUMBNAIL_SIZE) {
      setError('The image must be smaller than 5MB.');
      e.target.value = '';
      setThumbnail(null);
      return;
    }
    setError('');
    setThumbnail(file);
  };

  const onSubmit = async (data: CourseFormValues) => {
    setError('');
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)));
      if (thumbnail) formData.append('thumbnail', thumbnail);

      if (id) {
        await courseService.updateCourse(id, formData);
        navigate('/instructor/dashboard');
      } else {
        // New courses start as drafts, so lectures come next
        const course = await courseService.createCourse(formData);
        navigate(`/instructor/courses/${course._id}/lectures`);
      }
    } catch (err) {
      setError(errorMessage(err, 'The course could not be saved. Please try again.'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/instructor/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
        &larr; Back to dashboard
      </Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold text-gray-900">{isEdit ? 'Edit course' : 'Create course'}</h1>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
          <textarea id="description" rows={5} {...register('description')} className={inputClasses} />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select id="category" {...register('category')} className={inputClasses}>
              {COURSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Level
            </label>
            <select id="level" {...register('level')} className={inputClasses}>
              {COURSE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price in ₹ (0 for free)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step="1"
              {...register('price', { valueAsNumber: true })}
              className={inputClasses}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <input
              id="duration"
              type="text"
              placeholder="6 hours"
              {...register('duration')}
              className={inputClasses}
            />
            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
            Thumbnail image (optional)
          </label>
          {currentThumbnail && !thumbnail && (
            <img
              src={thumbnailUrl(currentThumbnail)}
              alt=""
              className="mt-2 h-24 w-40 rounded-md object-cover"
            />
          )}
          <input
            id="thumbnail"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleThumbnailChange}
            className="mt-2 block w-full text-sm text-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 5MB.</p>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create course'}
        </Button>
      </form>
    </div>
  );
};

export default CourseForm;
