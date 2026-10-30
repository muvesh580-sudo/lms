import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { RootState } from '../../features/store';
import contactService from '../../services/contactService';
import { errorMessage } from '../../services/config';
import Button from '../ui/Button';

// Form validation schema (matches server/models/contactMessageModel.js)
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot be more than 2000 characters'),
  website: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClasses =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm';

const Contact: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', message: '', website: '' },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setError('');
    try {
      await contactService.sendMessage(data);
      setSent(true);
      reset({ name: user?.name || '', email: user?.email || '', message: '', website: '' });
    } catch (err) {
      setError(errorMessage(err, 'Your message could not be sent. Please try again.'));
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            Have a question about a course or your account? Send us a message.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        {sent ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center" role="status">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Thanks for reaching out</h2>
            <p className="mt-2 text-gray-600">Your message has been sent.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setSent(false)}>
                Send another message
              </Button>
              <Link
                to="/courses"
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Browse courses
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your name
              </label>
              <input id="name" type="text" autoComplete="name" {...register('name')} className={inputClasses} />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input id="email" type="email" autoComplete="email" {...register('email')} className={inputClasses} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                maxLength={2000}
                {...register('message')}
                className={inputClasses}
                placeholder="How can we help?"
              />
              {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
            </div>

            {/* Hidden trap for bots: people never see or fill in this field */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send message'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
