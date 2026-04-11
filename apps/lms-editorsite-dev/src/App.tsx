import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@lms/shared-ui';
import LoginPage from './pages/LoginPage';
import AuthGuard from './components/AuthGuard';

const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CoursesPage = React.lazy(() => import('./pages/CoursesPage'));
const KnowledgeBasePage = React.lazy(() => import('./pages/KnowledgeBasePage'));
const WebsitePage = React.lazy(() => import('./pages/WebsitePage'));
const BlogPostsPage = React.lazy(() => import('./pages/BlogPostsPage'));
const AddNewCoursePage = React.lazy(() => import('./pages/AddNewCoursePage'));
const AddNewKnowledgePage = React.lazy(() => import('./pages/AddNewKnowledgePage'));
const AddNewWebPage = React.lazy(() => import('./pages/AddNewWebPage'));
const AddNewBlogPostPage = React.lazy(() => import('./pages/AddNewBlogPostPage'));
const EditWebPage = React.lazy(() => import('./pages/EditWebPage'));
const EditBlogPostPage = React.lazy(() => import('./pages/EditBlogPostPage'));
const EditKnowledgePage = React.lazy(() => import('./pages/EditKnowledgePage'));
const EditPathPage = React.lazy(() => import('./pages/EditPathPage'));
const EditUnitPage = React.lazy(() => import('./pages/EditUnitPage'));
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
          <Route path="/" element={<AuthGuard><Navigate to="/dashboard" replace /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/courses" element={<AuthGuard><CoursesPage /></AuthGuard>} />
          <Route path="/courses/new" element={<AuthGuard><AddNewCoursePage /></AuthGuard>} />
          <Route path="/courses/edit/:pathId" element={<AuthGuard><EditPathPage /></AuthGuard>} />
          <Route path="/courses/units/:unitId/edit" element={<AuthGuard><EditUnitPage /></AuthGuard>} />
          <Route path="/knowledge-base" element={<AuthGuard><KnowledgeBasePage /></AuthGuard>} />
          <Route path="/knowledge-base/new" element={<AuthGuard><AddNewKnowledgePage /></AuthGuard>} />
          <Route path="/knowledge-base/edit/:slug" element={<AuthGuard><EditKnowledgePage /></AuthGuard>} />
          <Route path="/website" element={<AuthGuard><WebsitePage /></AuthGuard>} />
          <Route path="/website/new" element={<AuthGuard><AddNewWebPage /></AuthGuard>} />
          <Route path="/website/edit/:slug" element={<AuthGuard><EditWebPage /></AuthGuard>} />
          <Route path="/blog-posts" element={<AuthGuard><BlogPostsPage /></AuthGuard>} />
          <Route path="/blog-posts/new" element={<AuthGuard><AddNewBlogPostPage /></AuthGuard>} />
          <Route path="/blog-posts/edit/:slug" element={<AuthGuard><EditBlogPostPage /></AuthGuard>} />
          <Route path="/editor/:courseId" element={<AuthGuard><EditorPage /></AuthGuard>} />
          <Route path="/media" element={<AuthGuard><MediaLibraryPage /></AuthGuard>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
