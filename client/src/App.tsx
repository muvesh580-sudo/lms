import { JSX } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './features/store'

import Layout from './components/layout/Layout'

import Home from './components/layout/Home'
import Login from './components/auth/Login'
import Register from './components/auth/Register'

import CourseList from './components/courses/CourseList'
import CourseDetail from './components/courses/CourseDetail'

const StudentRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const InstructorRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated || user?.role !== 'instructor') {
    return <Navigate to="/login" replace />
  }

  return children
}

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  // You can add global effects here, like checking for stored auth token on app load

  return (
    <Routes>
      {/* Public routes wrapped in the main layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="about" element={<div className="p-10 text-center">About Page</div>} />
        <Route path="contact" element={<div className="p-10 text-center">Contact Page</div>} />

        {/* Student routes */}
        <Route path="student/dashboard" element={
          <StudentRoute>
            <div className="p-10 text-center">Student Dashboard</div>
          </StudentRoute>
        } />
        <Route path="my-courses" element={
          <StudentRoute>
            <div className="p-10 text-center">My Courses</div>
          </StudentRoute>
        } />
        <Route path="learn/lecture/:id" element={
          <StudentRoute>
            <div className="p-10 text-center">Lecture View</div>
          </StudentRoute>
        } />
        <Route path="profile" element={
          <StudentRoute>
            <div className="p-10 text-center">User Profile</div>
          </StudentRoute>
        } />

        {/* Instructor routes */}
        <Route path="instructor/dashboard" element={
          <InstructorRoute>
            <div className="p-10 text-center">Instructor Dashboard</div>
          </InstructorRoute>
        } />
        <Route path="instructor/courses" element={
          <InstructorRoute>
            <div className="p-10 text-center">Instructor Courses</div>
          </InstructorRoute>
        } />
        <Route path="instructor/courses/create" element={
          <InstructorRoute>
            <div className="p-10 text-center">Create Course</div>
          </InstructorRoute>
        } />
        <Route path="instructor/courses/:id/edit" element={
          <InstructorRoute>
            <div className="p-10 text-center">Edit Course</div>
          </InstructorRoute>
        } />
        <Route path="instructor/courses/:courseId/lectures" element={
          <InstructorRoute>
            <div className="p-10 text-center">Course Lectures</div>
          </InstructorRoute>
        } />

        {/* Admin routes */}
        <Route path="admin/dashboard" element={
          <AdminRoute>
            <div className="p-10 text-center">Admin Dashboard</div>
          </AdminRoute>
        } />
        <Route path="admin/users" element={
          <AdminRoute>
            <div className="p-10 text-center">Manage Users</div>
          </AdminRoute>
        } />
        <Route path="admin/courses" element={
          <AdminRoute>
            <div className="p-10 text-center">Manage Courses</div>
          </AdminRoute>
        } />
        <Route path="admin/payments" element={
          <AdminRoute>
            <div className="p-10 text-center">Payment Reports</div>
          </AdminRoute>
        } />

        {/* 404 catch-all */}
        <Route path="*" element={
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-red-500">404</h1>
            <p className="mt-2 text-xl">Page not found</p>
          </div>
        } />
      </Route>
    </Routes>
  )
}

export default App
