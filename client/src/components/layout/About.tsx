import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ClockIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { RootState } from '../../features/store';

const reasons = [
  {
    icon: EyeIcon,
    title: 'Try before you enroll',
    text: 'Watch preview lectures for free and see if a course is right for you before you commit.',
  },
  {
    icon: ClockIcon,
    title: 'Learn at your own pace',
    text: 'Start, pause and come back to your lectures whenever it suits your schedule.',
  },
  {
    icon: Squares2X2Icon,
    title: 'Courses for every level',
    text: 'Find courses from beginner to advanced across topics like web development, data science and design.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Learn on any device',
    text: 'Use it on your phone, tablet or computer, wherever you are.',
  },
  {
    icon: StarIcon,
    title: 'Honest reviews',
    text: 'Ratings come only from students enrolled in the course, so you can choose with confidence.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Everything in one place',
    text: 'All your enrolled courses are saved in My Courses, so they are always easy to find.',
  },
];

const steps = [
  { title: 'Find a course', text: 'Search by topic, or filter by category and level.' },
  { title: 'Watch a preview', text: 'Get a feel for the course with its free preview lecture.' },
  { title: 'Enroll', text: 'Join free courses instantly, or pay securely for paid ones.' },
  { title: 'Start learning', text: 'Watch your lectures and rate the course when you are ready.' },
];

const About: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Learning that fits your life
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            We believe anyone can learn something new, given the right course and the freedom to go at their own pace.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {/* Mission */}
        <section aria-labelledby="mission-heading" className="mx-auto max-w-3xl text-center">
          <h2 id="mission-heading" className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Our mission
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Our goal is to make learning simple. Whether you are starting something new or building on what you
            already know, you should be able to find a good course, see what it offers, and start learning without
            any hassle.
          </p>
        </section>

        {/* Why learn here */}
        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Why learn with us
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-gray-200 p-6">
                <div className="inline-flex rounded-md bg-primary-50 p-2">
                  <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, text }, index) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Call to action */}
      <div className="bg-indigo-700">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to start learning?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/courses"
              className="rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Browse courses
            </Link>
            {!user && (
              <Link
                to="/register"
                className="rounded-md bg-indigo-500 px-6 py-3 text-base font-medium text-white hover:bg-indigo-400"
              >
                Sign up free
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
