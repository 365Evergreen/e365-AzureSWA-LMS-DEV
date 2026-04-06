import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@lms/shared-ui';
import LoginPage from './pages/LoginPage';
import AuthGuard from './components/AuthGuard';

const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const EditorPage = React.lazy(() => import('./pages/EditorPage'));
const MediaLibraryPage = React.lazy(() => import('./pages/MediaLibraryPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/welcome" element={<AuthGuard><WelcomePage /></AuthGuard>} />
          <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/editor/:courseId" element={<AuthGuard><EditorPage /></AuthGuard>} />
          <Route path="/media" element={<AuthGuard><MediaLibraryPage /></AuthGuard>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
