// Backend origin, configurable per environment via client/.env (VITE_API_ORIGIN)
export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '');

export const API_URL = `${API_ORIGIN}/api`;

// Turn a server-relative path (e.g. a lecture's videoStreamUrl) into an absolute URL
export const apiUrl = (path: string) => `${API_ORIGIN}${path}`;

// Inline fallback so a missing thumbnail does not depend on a third-party image host
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#6b7280" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">Course Image</text></svg>'
  );

export const thumbnailUrl = (thumbnail?: string) =>
  thumbnail && !thumbnail.startsWith('default-')
    ? `${API_ORIGIN}/uploads/thumbnails/${encodeURIComponent(thumbnail)}`
    : PLACEHOLDER_IMAGE;

// Read the server's error message from an axios error
export const errorMessage = (error: unknown, fallback = 'Something went wrong') => {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
};

export type Role = 'student' | 'instructor' | 'admin';

export const dashboardPath = (role?: Role) =>
  role === 'admin' ? '/admin/dashboard' : role === 'instructor' ? '/instructor/dashboard' : '/my-courses';
