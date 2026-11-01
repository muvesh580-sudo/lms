import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppDispatch, RootState } from '../../features/store';
import { setUser } from '../../features/auth/authSlice';
import authService from '../../services/authService';
import { errorMessage } from '../../services/config';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

// Form validation schemas (match server/models/userModel.js)
const detailsSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type DetailsFormValues = z.infer<typeof detailsSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const MAX_PHOTO_SIZE = 5000000; // 5MB, same as the server limit

const inputClasses =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm';

const Notice: React.FC<{ type: 'error' | 'success'; children: React.ReactNode }> = ({ type, children }) => (
  <div
    className={`rounded-md p-4 ${type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}
    role={type === 'error' ? 'alert' : 'status'}
  >
    <p className={`text-sm ${type === 'error' ? 'text-red-700' : 'text-green-700'}`}>{children}</p>
  </div>
);

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  // Changing the key clears the file input, which React cannot do through state
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [detailsStatus, setDetailsStatus] = useState({ error: '', success: '' });
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '' });

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  // Free the preview's memory when it is replaced or the page closes
  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_PHOTO_SIZE) {
      setDetailsStatus({ error: 'The photo must be smaller than 5MB.', success: '' });
      e.target.value = '';
      setPhoto(null);
      return;
    }
    setDetailsStatus({ error: '', success: '' });
    setPhoto(file);
  };

  const saveDetails = async (data: DetailsFormValues) => {
    setDetailsStatus({ error: '', success: '' });
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      if (photo) formData.append('profilePic', photo);

      dispatch(setUser(await authService.updateProfile(formData)));
      setPhoto(null);
      setPhotoInputKey((key) => key + 1);
      setDetailsStatus({ error: '', success: 'Your profile has been updated.' });
    } catch (err) {
      setDetailsStatus({ error: errorMessage(err, 'Your profile could not be saved.'), success: '' });
    }
  };

  const savePassword = async (data: PasswordFormValues) => {
    setPasswordStatus({ error: '', success: '' });
    try {
      const formData = new FormData();
      formData.append('currentPassword', data.currentPassword);
      formData.append('password', data.password);

      dispatch(setUser(await authService.updateProfile(formData)));
      passwordForm.reset();
      setPasswordStatus({ error: '', success: 'Your password has been changed.' });
    } catch (err) {
      setPasswordStatus({ error: errorMessage(err, 'Your password could not be changed.'), success: '' });
    }
  };

  const detailsErrors = detailsForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>

      <form
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={detailsForm.handleSubmit(saveDetails)}
        noValidate
      >
        <h2 className="text-xl font-semibold text-gray-900">Account details</h2>

        {detailsStatus.error && <Notice type="error">{detailsStatus.error}</Notice>}
        {detailsStatus.success && <Notice type="success">{detailsStatus.success}</Notice>}

        <div className="flex items-center gap-4">
          <Avatar
            name={user?.name}
            profilePic={user?.profilePic}
            previewUrl={photoPreview}
            className="h-20 w-20 flex-shrink-0 text-2xl"
          />
          <div className="min-w-0">
            <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">
              Profile photo
            </label>
            <input
              key={photoInputKey}
              id="profilePic"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handlePhotoChange}
              className="mt-1 block w-full text-sm text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF, up to 5MB.</p>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            {...detailsForm.register('name')}
            className={inputClasses}
          />
          {detailsErrors.name && <p className="mt-1 text-sm text-red-600">{detailsErrors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...detailsForm.register('email')}
            className={inputClasses}
          />
          {detailsErrors.email && <p className="mt-1 text-sm text-red-600">{detailsErrors.email.message}</p>}
        </div>

        <p className="text-sm text-gray-600">
          Account type: <span className="font-medium capitalize text-gray-900">{user?.role}</span>
        </p>

        <Button type="submit" disabled={detailsForm.formState.isSubmitting}>
          {detailsForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>

      <form
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={passwordForm.handleSubmit(savePassword)}
        noValidate
      >
        <h2 className="text-xl font-semibold text-gray-900">Change password</h2>

        {passwordStatus.error && <Notice type="error">{passwordStatus.error}</Notice>}
        {passwordStatus.success && <Notice type="success">{passwordStatus.success}</Notice>}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...passwordForm.register('currentPassword')}
            className={inputClasses}
          />
          {passwordErrors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('password')}
            className={inputClasses}
          />
          {passwordErrors.password && <p className="mt-1 text-sm text-red-600">{passwordErrors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('confirmPassword')}
            className={inputClasses}
          />
          {passwordErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
          {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change password'}
        </Button>
      </form>
    </div>
  );
};

export default Profile;
