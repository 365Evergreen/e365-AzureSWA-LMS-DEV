import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@lms/shared-ui';
import AppNav from '../../components/AppNav';
import { listPages, patchPageMeta, type PageSummary, type PatchPageMetaRequest } from '../../api/pages';
import styles from './WebsitePage.module.css';

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
  page: PageSummary;
  onClose: () => void;
  onSaved: (updated: Partial<PageSummary>) => void;
}

function QuickEditDrawer({ page, onClose, onSaved }: QuickEditDrawerProps) {
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(page.status);
  const [inNav, setInNav] = useState(page.inNav ?? false);
  const [navLabel, setNavLabel] = useState(page.navLabel ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const patch: PatchPageMetaRequest = {
        contentType: page.contentType,
        title,
        description,
        status,
        inNav,
        navLabel: navLabel || title,
        navParent: page.navParent,
        navOrder: page.navOrder,
      };
      await patchPageMeta(page.slug, patch);
      onSaved({ title, description, status, inNav, navLabel: navLabel || title });
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
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Description</span>
            <textarea
              className={styles.textarea}
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <div className={styles.statusToggle}>
              <button
                className={`${styles.statusBtn} ${status === 'draft' ? styles.statusActive : ''}`}
                onClick={() => setStatus('draft')}
              >
                Draft
              </button>
              <button
                className={`${styles.statusBtn} ${status === 'published' ? styles.statusActive : ''}`}
                onClick={() => setStatus('published')}
              >
                Published
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Include in navigation</span>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={inNav}
                onChange={(e) => setInNav(e.target.checked)}
                className={styles.toggleInput}
              />
              <span className={styles.toggleTrack} />
            </label>
          </div>
          {inNav && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Navigation label</span>
              <input
                className={styles.input}
                value={navLabel}
                placeholder={title}
                onChange={(e) => setNavLabel(e.target.value)}
              />
            </label>
          )}
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>
        <div className={styles.drawerFooter}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </div>
      </aside>
    </div>
  );
}

interface PageCardProps {
  page: PageSummary;
  onQuickEdit: (page: PageSummary) => void;
  onEdit: (page: PageSummary) => void;
  previewBase: string;
}

function PageCard({ page, onQuickEdit, onEdit, previewBase }: PageCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <StatusBadge status={page.status} />
        {page.inNav && <span className={styles.navPill}>In nav</span>}
      </div>
      <h3 className={styles.cardTitle}>{page.title}</h3>
      {page.description && <p className={styles.cardDesc}>{page.description}</p>}
      <div className={styles.cardMeta}>
        <span>Updated {formatDate(page.updatedAt)}</span>
        <span className={styles.cardSlug}>/{page.slug}</span>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(page)}>
          Edit
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={() => onQuickEdit(page)}>
          Quick edit
        </button>
        {previewBase && (
          <a
            className={styles.actionLink}
            href={`${previewBase}/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview ↗
          </a>
        )}
      </div>
    </div>
  );
}

interface PageRowProps {
  page: PageSummary;
  onQuickEdit: (page: PageSummary) => void;
  onEdit: (page: PageSummary) => void;
  previewBase: string;
}

function PageRow({ page, onQuickEdit, onEdit, previewBase }: PageRowProps) {
  return (
    <tr className={styles.row}>
      <td className={styles.cell}>
        <div className={styles.rowTitle}>{page.title}</div>
        <div className={styles.rowSlug}>/{page.slug}</div>
      </td>
      <td className={styles.cell}><StatusBadge status={page.status} /></td>
      <td className={styles.cell}>{page.inNav ? <span className={styles.navPill}>Yes</span> : <span className={styles.muted}>No</span>}</td>
      <td className={styles.cell}>{formatDate(page.updatedAt)}</td>
      <td className={`${styles.cell} ${styles.rowActions}`}>
        <button className={styles.actionBtn} onClick={() => onEdit(page)}>Edit</button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={() => onQuickEdit(page)}>Quick edit</button>
        {previewBase && (
          <a className={styles.actionLink} href={`${previewBase}/${page.slug}`} target="_blank" rel="noopener noreferrer">
            Preview ↗
          </a>
        )}
      </td>
    </tr>
  );
}

export default function WebsitePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('grid');
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<PageSummary | null>(null);

  const previewBase = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPages('page');
      setPages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleEdit(page: PageSummary) {
    navigate(`/website/edit/${encodeURIComponent(page.slug)}`);
  }

  function handleQuickEditSaved(updated: Partial<PageSummary>) {
    if (!editingPage) return;
    setPages((prev) =>
      prev.map((p) => p.slug === editingPage.slug ? { ...p, ...updated } : p)
    );
    setEditingPage(null);
  }

  return (
    <div className={styles.page}>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Website</h1>
          <div className={styles.headerRight}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${view === 'grid' ? styles.toggleActive : ''}`}
                onClick={() => setView('grid')}
                aria-label="Grid view"
                title="Grid view"
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
                onClick={() => setView('list')}
                aria-label="List view"
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="14" height="2" rx="1" />
                  <rect x="1" y="7" width="14" height="2" rx="1" />
                  <rect x="1" y="12" width="14" height="2" rx="1" />
                </svg>
              </button>
            </div>
            <Button onClick={() => navigate('/website/new')}>+ New Page</Button>
          </div>
        </div>

        {loading && <p className={styles.stateMsg}>Loading pages…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && pages.length === 0 && (
          <p className={styles.stateMsg}>No pages yet. Create your first page to get started.</p>
        )}

        {!loading && !error && pages.length > 0 && view === 'grid' && (
          <div className={styles.grid}>
            {pages.map((p) => (
              <PageCard key={p.slug} page={p} onQuickEdit={setEditingPage} onEdit={handleEdit} previewBase={previewBase} />
            ))}
          </div>
        )}

        {!loading && !error && pages.length > 0 && view === 'list' && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Page</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>In nav</th>
                  <th className={styles.th}>Updated</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <PageRow key={p.slug} page={p} onQuickEdit={setEditingPage} onEdit={handleEdit} previewBase={previewBase} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingPage && (
        <QuickEditDrawer
          page={editingPage}
          onClose={() => setEditingPage(null)}
          onSaved={handleQuickEditSaved}
        />
      )}
    </div>
  );
}
