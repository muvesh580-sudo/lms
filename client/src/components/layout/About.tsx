import React from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  CodeBracketIcon,
  CreditCardIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const GITHUB_URL = 'https://github.com/muvesh580-sudo/lms';

const features = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Course catalogue',
    text: 'Search by title, filter by category and level, and browse results page by page.',
  },
  {
    icon: PlayCircleIcon,
    title: 'Lecture player',
    text: 'Preview lectures are open to everyone. Full lectures unlock after enrollment.',
  },
  {
    icon: CreditCardIcon,
    title: 'Enrollment',
    text: 'Free courses enroll instantly. Paid courses use a Razorpay checkout integration.',
  },
  {
    icon: StarIcon,
    title: 'Ratings and reviews',
    text: 'Enrolled students can rate a course and leave a review.',
  },
  {
    icon: UserGroupIcon,
    title: 'Role-based accounts',
    text: 'Separate student, instructor and admin roles, enforced by the API.',
  },
  {
    icon: LockClosedIcon,
    title: 'Protected content',
    text: 'Paid videos and materials are served through short-lived links, never public URLs.',
  },
];

const stack = [
  { area: 'Frontend', items: ['React 19', 'TypeScript', 'Vite', 'Redux Toolkit', 'React Router', 'Tailwind CSS'] },
  { area: 'Backend', items: ['Node.js', 'Express', 'JWT authentication', 'Multer uploads', 'Razorpay'] },
  { area: 'Database', items: ['MongoDB', 'Mongoose'] },
  { area: 'Hosting', items: ['Vercel', 'Render', 'MongoDB Atlas'] },
];

const security = [
  'Passwords are hashed with bcrypt, and roles can never be set from a sign-up request.',
  'Payments are tied to the order and user that created them, and each order can be redeemed once.',
  'Login is rate limited, and requests are checked against NoSQL injection.',
  'Security headers and a restricted CORS policy protect the API.',
  'Integration tests cover authentication, permissions, enrollment and payments.',
];

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">About this project</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            A full-stack learning management system
          </h1>
          <p className="mt-4 text-lg text-indigo-100">
            LMS is a portfolio project built with the MERN stack. Students can browse courses, enroll and watch
            lectures, while the API handles roles, payments and access to paid content.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-white px-5 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <CodeBracketIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              View source on GitHub
            </a>
            <Link
              to="/courses"
              className="inline-flex items-center rounded-md bg-indigo-500 px-5 py-3 text-base font-medium text-white hover:bg-indigo-400"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {/* Features */}
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold text-gray-900">
            What it does
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-gray-200 p-5">
                <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section aria-labelledby="stack-heading">
          <h2 id="stack-heading" className="text-2xl font-bold text-gray-900">
            Tech stack
          </h2>
          <dl className="mt-6 space-y-4">
            {stack.map(({ area, items }) => (
              <div key={area} className="sm:flex sm:items-baseline">
                <dt className="w-28 flex-shrink-0 font-semibold text-gray-900">{area}</dt>
                <dd className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                  {items.map((item) => (
                    <span key={item} className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Security */}
        <section aria-labelledby="security-heading">
          <h2 id="security-heading" className="text-2xl font-bold text-gray-900">
            Security and testing
          </h2>
          <ul className="mt-6 space-y-3">
            {security.map((item) => (
              <li key={item} className="flex items-start">
                <ShieldCheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-green-600" aria-hidden="true" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Status */}
        <section aria-labelledby="status-heading" className="rounded-lg bg-gray-50 p-6">
          <div className="flex items-center">
            <AcademicCapIcon className="mr-2 h-6 w-6 text-primary-600" aria-hidden="true" />
            <h2 id="status-heading" className="text-xl font-bold text-gray-900">
              Project status
            </h2>
          </div>
          <p className="mt-3 text-gray-700">
            The student experience is live. Instructor and admin features are available through the API, and their
            dashboards are in progress. The courses here are demo data, and paid checkout needs Razorpay test keys.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
