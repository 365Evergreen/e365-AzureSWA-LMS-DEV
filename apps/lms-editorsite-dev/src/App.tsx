import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@lms/shared-ui';
import LoginPage from './pages/LoginPage';
import AuthGuard from './components/AuthGuard';

const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const AppShell = React.lazy(() => import('./components/AppShell'));
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
          <Route element={<AuthGuard><AppShell /></AuthGuard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/new" element={<AddNewCoursePage />} />
            <Route path="/courses/edit/:pathId" element={<EditPathPage />} />
            <Route path="/courses/units/:unitId/edit" element={<EditUnitPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/knowledge-base/new" element={<AddNewKnowledgePage />} />
            <Route path="/knowledge-base/edit/:slug" element={<EditKnowledgePage />} />
            <Route path="/website" element={<WebsitePage />} />
            <Route path="/website/new" element={<AddNewWebPage />} />
            <Route path="/website/edit/:slug" element={<EditWebPage />} />
            <Route path="/blog-posts" element={<BlogPostsPage />} />
            <Route path="/blog-posts/new" element={<AddNewBlogPostPage />} />
            <Route path="/blog-posts/edit/:slug" element={<EditBlogPostPage />} />
            <Route path="/editor/:courseId" element={<EditorPage />} />
            <Route path="/media" element={<MediaLibraryPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
