import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary, LoadingSpinner } from '@lms/shared-ui'
import { Layout } from './components/Layout'

const HomePage = React.lazy(() => import('./pages/HomePage'))
const BlogPage = React.lazy(() => import('./pages/BlogPage'))
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'))
const KBPage = React.lazy(() => import('./pages/KBPage'))
const KBArticlePage = React.lazy(() => import('./pages/KBArticlePage'))
const CataloguePage = React.lazy(() => import('./pages/CataloguePage'))
const WebsitePage = React.lazy(() => import('./pages/WebsitePage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/course-catalogue" element={<CataloguePage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/courses/:slug" element={<WebsitePage />} />
              <Route path="/latest-posts" element={<BlogPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/kb" element={<KBPage />} />
              <Route path="/kb/:slug" element={<KBArticlePage />} />
              {/* CMS-managed pages — must come before 404 */}
              <Route path="/:slug" element={<WebsitePage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
