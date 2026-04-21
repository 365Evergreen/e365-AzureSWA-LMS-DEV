import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { BlockType } from '@lms/block-registry';
import { LoadingSpinner } from '@lms/shared-ui';
import ContentEditor, { type ContentEditorInitialData } from '../../components/ContentEditor';
import { loadEditorPage } from '../../api/pages';
import styles from './EditWebPage.module.css';

export default function EditWebPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<ContentEditorInitialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { navigate('/website'); return; }
    loadEditorPage(slug, 'page')
      .then(({ metadata, bundle }) => {
        setInitialData({
          slug: metadata.slug,
          title: metadata.title,
          description: metadata.description,
          templateId: metadata.templateId,
          status: metadata.status,
          blocks: (bundle?.blocks ?? []).map((b) => ({
            id: b.id,
            type: b.type as BlockType,
            payload: b.payload,
          })),
          inNav: metadata.inNav,
          navLabel: metadata.navLabel,
          navParent: metadata.navParent,
          navOrder: metadata.navOrder,
          linkedCourseId: metadata.linkedCourseId,
          linkedCourseSlug: metadata.linkedCourseSlug,
          linkedCourseTitle: metadata.linkedCourseTitle,
          featuredImage: metadata.featuredImage,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'));
  }, [slug, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
          <button className={styles.back} onClick={() => navigate('/website')}>← Back to pages</button>
        </main>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className={styles.page}>
        <main className={styles.main}><LoadingSpinner /></main>
      </div>
    );
  }

  return (
    <ContentEditor
      contentType="page"
      initialData={initialData}
      returnPath="/website"
    />
  );
}
