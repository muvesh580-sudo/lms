import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../features/store';
import { dashboardPath } from '../../services/config';

const Footer: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <footer className="bg-gray-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary-500">LMS</h2>
            <p className="text-gray-300">
              A platform for online learning. Access your courses from anywhere, anytime.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/muvesh580-sudo/lms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-white">
                  Browse Courses
                </Link>
              </li>
              {user ? (
                <li>
                  <Link to={dashboardPath(user.role)} className="text-gray-300 hover:text-white">
                    {user.role === 'student' ? 'My Courses' : 'Dashboard'}
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="text-gray-300 hover:text-white">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-gray-300 hover:text-white">
                      Create Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} LMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;