import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Waiting for a sleeping server ---
// The free hosting plan stops the backend when it is idle. While it starts again
// (up to about a minute) requests fail with no response at all, so the client
// waits for the server and then repeats the request instead of failing at once.

const MAX_WAKE_WAIT_MS = 90000;
const HEALTH_CHECK_INTERVAL_MS = 3000;

type WakingListener = (waking: boolean) => void;
const wakingListeners = new Set<WakingListener>();

// Lets the layout show a "waking up" notice
export const onServerWaking = (listener: WakingListener) => {
  wakingListeners.add(listener);
  return () => {
    wakingListeners.delete(listener);
  };
};

const setWaking = (waking: boolean) => wakingListeners.forEach((listener) => listener(waking));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface WakeResult {
  reachable: boolean;
  // The first health check failed, so the server was down when the request was sent
  wasDown: boolean;
}

// Requests that fail together share one wait
let pendingWake: Promise<WakeResult> | null = null;

const waitForServer = () => {
  if (!pendingWake) {
    pendingWake = (async () => {
      const started = Date.now();
      let wasDown = false;
      while (Date.now() - started < MAX_WAKE_WAIT_MS) {
        try {
          await axios.get(`${API_URL}/health`, { timeout: 10000 });
          return { reachable: true, wasDown };
        } catch {
          if (!wasDown) {
            wasDown = true;
            setWaking(true);
          }
          await delay(HEALTH_CHECK_INTERVAL_MS);
        }
      }
      return { reachable: false, wasDown };
    })().finally(() => {
      setWaking(false);
      pendingWake = null;
    });
  }
  return pendingWake;
};

type RetryableConfig = InternalAxiosRequestConfig & { retriedAfterWake?: boolean };

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;

    // No response at all: the server may be asleep or still starting
    if (!error.response && config && !config.retriedAfterWake && error.code !== 'ERR_CANCELED') {
      const { reachable, wasDown } = await waitForServer();
      // Reading is always safe to repeat. A form submission is only repeated when the
      // server was down, because then it never received the first attempt
      if (reachable && (config.method === 'get' || wasDown)) {
        config.retriedAfterWake = true;
        return api(config);
      }
    }

    const url: string = config?.url || '';
    const isAuthRequest = url.includes('/users/login') || url.includes('/users/register');

    // Handle session expiry - but a failed login is not an expired session,
    // and redirecting there would wipe the "invalid password" message
    if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('token')) {
      // Clear session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
