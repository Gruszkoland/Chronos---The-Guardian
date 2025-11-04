/**
 * App.tsx
 * Application router and top-level providers.
 */

import { HashRouter, Route, Routes, Navigate } from 'react-router'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ChatPage from './pages/Chat'
import ForumPage from './pages/Forum'
import AdminSettingsPage from './pages/AdminSettings'
import './i18n'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'

/** Route guard for authenticated users. */
function PrivateRoute({ element }: { element: JSX.Element }) {
  const { user } = useAuth()
  return user ? element : <Navigate to="/login" />
}

/** Route guard for admin users. */
function AdminRoute({ element }: { element: JSX.Element }) {
  const { user } = useAuth()
  return user && user.isAdmin ? element : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<PrivateRoute element={<ChatPage />} />} />
            <Route path="/forum" element={<PrivateRoute element={<ForumPage />} />} />
            <Route path="/admin" element={<AdminRoute element={<AdminSettingsPage />} />} />
          </Routes>
        </HashRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
