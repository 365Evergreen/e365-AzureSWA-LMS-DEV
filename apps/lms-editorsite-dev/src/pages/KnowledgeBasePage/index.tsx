import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import { listPages, patchPageMeta, type PageSummary, type PatchPageMetaRequest } from '../../api/pages';
import styles from './KnowledgeBasePage.module.css';

type ViewMode = 'grid' | 'list';

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return (
    <span className={`${styles.badge} ${status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface QuickEditDrawerProps {
  article: PageSummary;
  onClose: () => void;
  onSaved: (updated: Partial<PageSummary>) => void;
}

function QuickEditDrawer({ article, onClose, onSaved }: QuickEditDrawerProps) {
  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(article.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const patch: PatchPageMetaRequest = { contentType: 'knowledge', title, description, status };
      await patchPageMeta(article.slug, patch);
      onSaved({ title, description, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Quick Edit</h2>
          <button className={styles.drawerClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.drawerBody}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Title</span>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Description</span>
            <textarea className={styles.textarea} value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <div className={styles.statusToggle}>
              <button className={`${styles.statusBtn} ${status === 'draft' ? styles.statusActive : ''}`} onClick={() => setStatus('draft')}>Draft</button>
              <button className={`${styles.statusBtn} ${status === 'published' ? styles.statusActive : ''}`} onClick={() => setStatus('published')}>Published</button>
            </div>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>
        <div className={styles.drawerFooter}>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </div>
      </aside>
    </div>
  );
}

interface ArticleCardProps {
  article: PageSummary;
  onQuickEdit: (a: PageSummary) => void;
  onEdit: (a: PageSummary) => void;
  previewBase: string;
}

function ArticleCard({ article, onQuickEdit, onEdit, previewBase }: ArticleCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <StatusBadge status={article.status} />
      </div>
      <h3 className={styles.cardTitle}>{article.title}</h3>
      {article.description && <p className={styles.cardDesc}>{article.description}</p>}
      <div className={styles.cardMeta}>
        <span>Updated {formatDate(article.updatedAt)}</span>
        <span className={styles.cardSlug}>/{article.slug}</span>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(article)}>Edit</button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={() => onQuickEdit(article)}>Quick edit</button>
        {previewBase && (
          <a className={styles.actionLink} href={`${previewBase}/${article.slug}`} target="_blank" rel="noopener noreferrer">Preview ↗</a>
        )}
      </div>
    </div>
  );
}

interface ArticleRowProps {
  article: PageSummary;
  onQuickEdit: (a: PageSummary) => void;
  onEdit: (a: PageSummary) => void;
  previewBase: string;
}

function ArticleRow({ article, onQuickEdit, onEdit, previewBase }: ArticleRowProps) {
  return (
    <tr className={styles.row}>
      <td className={styles.cell}>
        <div className={styles.rowTitle}>{article.title}</div>
        <div className={styles.rowSlug}>/{article.slug}</div>
      </td>
      <td className={styles.cell}><StatusBadge status={article.status} /></td>
      <td className={styles.cell}>{formatDate(article.updatedAt)}</td>
      <td className={`${styles.cell} ${styles.rowActions}`}>
        <button className={styles.actionBtn} onClick={() => onEdit(article)}>Edit</button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={() => onQuickEdit(article)}>Quick edit</button>
        {previewBase && (
          <a className={styles.actionLink} href={`${previewBase}/${article.slug}`} target="_blank" rel="noopener noreferrer">Preview ↗</a>
        )}
      </td>
    </tr>
  );
}

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('grid');
  const [articles, setArticles] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<PageSummary | null>(null);

  const previewBase = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setArticles(await listPages('knowledge'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleEdit(article: PageSummary) {
    navigate(`/knowledge-base/edit/${encodeURIComponent(article.slug)}`);
  }

  function handleQuickEditSaved(updated: Partial<PageSummary>) {
    if (!editingArticle) return;
    setArticles((prev) => prev.map((a) => a.slug === editingArticle.slug ? { ...a, ...updated } : a));
    setEditingArticle(null);
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Knowledge Base</h1>
          <div className={styles.headerRight}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${view === 'grid' ? styles.toggleActive : ''}`}
                onClick={() => setView('grid')} aria-label="Grid view" title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
              </button>
              <button
                className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setView('list')} aria-label="List view" title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="14" height="2" rx="1" />
                  <rect x="1" y="7" width="14" height="2" rx="1" />
                  <rect x="1" y="12" width="14" height="2" rx="1" />
                </svg>
              </button>
            </div>
            <Button onClick={() => navigate('/knowledge-base/new')}>+ New Article</Button>
          </div>
        </div>

        {loading && <p className={styles.stateMsg}>Loading articles…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && articles.length === 0 && (
          <p className={styles.stateMsg}>No articles yet. Create your first knowledge base article to get started.</p>
        )}

        {!loading && !error && articles.length > 0 && view === 'grid' && (
          <div className={styles.grid}>
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} onQuickEdit={setEditingArticle} onEdit={handleEdit} previewBase={previewBase} />
            ))}
          </div>
        )}

        {!loading && !error && articles.length > 0 && view === 'list' && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Article</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Updated</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <ArticleRow key={a.slug} article={a} onQuickEdit={setEditingArticle} onEdit={handleEdit} previewBase={previewBase} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingArticle && (
        <QuickEditDrawer article={editingArticle} onClose={() => setEditingArticle(null)} onSaved={handleQuickEditSaved} />
      )}
    </div>
  );
}
