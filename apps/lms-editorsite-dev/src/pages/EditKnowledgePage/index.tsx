import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { BlockType } from '@lms/block-registry';
import { LoadingSpinner } from '@lms/shared-ui';
import ContentEditor, { type ContentEditorInitialData } from '../../components/ContentEditor';
import { loadEditorPage } from '../../api/pages';
import styles from './EditKnowledgePage.module.css';

export default function EditKnowledgePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<ContentEditorInitialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { navigate('/knowledge-base'); return; }
    loadEditorPage(slug, 'knowledge')
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
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load article'));
  }, [slug, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
          <button className={styles.back} onClick={() => navigate('/knowledge-base')}>← Back to articles</button>
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
      contentType="knowledge"
      initialData={initialData}
      returnPath="/knowledge-base"
    />
  );
}
