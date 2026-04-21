import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@lms/shared-ui';
import { useAuth } from '@lms/shared-auth';
import { listPages, type PageSummary } from '../../api/pages';
import { listEditorCatalogueItems, type CatalogueItem } from '../../api/catalogue';
import { msalInstance } from '../../auth/msalConfig';
import styles from './DashboardPage.module.css';

type DashboardWidgetType =
  | 'recent-pages'
  | 'recent-posts'
  | 'recent-courses'
  | 'my-pages'
  | 'my-posts'
  | 'my-courses';

type DashboardLayout = 1 | 2 | 3;

interface DashboardWidgetConfig {
  id: string;
  type: DashboardWidgetType;
}

interface WidgetListItem {
  id: string;
  title: string;
  href: string;
  meta: string;
  badge?: string;
}

interface WidgetDescriptor {
  title: string;
  description: string;
  total: number;
  items: WidgetListItem[];
  emptyLabel: string;
}

const DASHBOARD_STORAGE_KEY = 'lms-editor-dashboard-v1';
const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'recent-pages', type: 'recent-pages' },
  { id: 'recent-posts', type: 'recent-posts' },
  { id: 'recent-courses', type: 'recent-courses' },
];

const WIDGET_OPTIONS: Array<{ value: DashboardWidgetType; label: string }> = [
  { value: 'recent-pages', label: 'Recent pages' },
  { value: 'recent-posts', label: 'Recent posts' },
  { value: 'recent-courses', label: 'Recent courses' },
  { value: 'my-pages', label: 'My pages' },
  { value: 'my-posts', label: 'My posts' },
  { value: 'my-courses', label: 'My courses' },
];

function readDashboardConfig(): { layout: DashboardLayout; widgets: DashboardWidgetConfig[] } {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) {
      return { layout: 3, widgets: DEFAULT_WIDGETS };
    }

    const parsed = JSON.parse(raw) as Partial<{ layout: DashboardLayout; widgets: DashboardWidgetConfig[] }>;
    return {
      layout: parsed.layout && [1, 2, 3].includes(parsed.layout) ? parsed.layout : 3,
      widgets: Array.isArray(parsed.widgets) && parsed.widgets.length > 0 ? parsed.widgets : DEFAULT_WIDGETS,
    };
  } catch {
    return { layout: 3, widgets: DEFAULT_WIDGETS };
  }
}

function formatDate(iso: string) {
  if (!iso) return 'No date';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeValue(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? '';
}

function getUserIdentifiers(user: ReturnType<typeof useAuth>['user']) {
  const claims = (user?.account.idTokenClaims as Record<string, unknown> | undefined) ?? {};
  return new Set(
    [
      user?.account.username,
      user?.account.name,
      user?.account.localAccountId,
      typeof claims.oid === 'string' ? claims.oid : '',
      typeof claims.sub === 'string' ? claims.sub : '',
    ]
      .map(normalizeValue)
      .filter(Boolean),
  );
}

function getWidgetDescriptor(
  type: DashboardWidgetType,
  pages: PageSummary[],
  posts: PageSummary[],
  courses: CatalogueItem[],
  userIdentifiers: Set<string>,
): WidgetDescriptor {
  const pageItems = [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const postItems = [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const courseItems = [...courses].sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));

  const matchesUser = (value: string | undefined) => userIdentifiers.has(normalizeValue(value));

  const toPageItems = (items: PageSummary[], basePath: '/website' | '/blog-posts') =>
    items.slice(0, 5).map((item) => ({
      id: item.pageId,
      title: item.title,
      href: `${basePath}/edit/${encodeURIComponent(item.slug)}`,
      meta: `Updated ${formatDate(item.updatedAt)}`,
      badge: item.status,
    }));

  const toCourseItems = (items: CatalogueItem[]) =>
    items.slice(0, 5).map((item) => ({
      id: item.itemId,
      title: item.title,
      href: `/courses/edit/${item.itemId}`,
      meta: `Updated ${formatDate(item.updatedOn)}`,
      badge: item.status,
    }));

  switch (type) {
    case 'recent-pages':
      return {
        title: 'Recent pages',
        description: 'The latest website pages in your workspace.',
        total: pages.length,
        items: toPageItems(pageItems, '/website'),
        emptyLabel: 'No website pages yet.',
      };
    case 'recent-posts':
      return {
        title: 'Recent posts',
        description: 'Latest blog posts across the site.',
        total: posts.length,
        items: toPageItems(postItems, '/blog-posts'),
        emptyLabel: 'No blog posts yet.',
      };
    case 'recent-courses':
      return {
        title: 'Recent courses',
        description: 'Recently updated course paths.',
        total: courses.length,
        items: toCourseItems(courseItems),
        emptyLabel: 'No courses yet.',
      };
    case 'my-pages': {
      const mine = pageItems.filter((item) => matchesUser(item.author));
      return {
        title: 'My pages',
        description: 'Website pages authored from your account.',
        total: mine.length,
        items: toPageItems(mine, '/website'),
        emptyLabel: 'No pages assigned to you yet.',
      };
    }
    case 'my-posts': {
      const mine = postItems.filter((item) => matchesUser(item.author));
      return {
        title: 'My posts',
        description: 'Blog posts you have worked on.',
        total: mine.length,
        items: toPageItems(mine, '/blog-posts'),
        emptyLabel: 'No posts assigned to you yet.',
      };
    }
    case 'my-courses': {
      const mine = courseItems.filter((item) => matchesUser(item.authorId));
      return {
        title: 'My courses',
        description: 'Courses linked to your editor account.',
        total: mine.length,
        items: toCourseItems(mine),
        emptyLabel: 'No courses assigned to you yet.',
      };
    }
  }
}

function SortableWidgetCard({
  widget,
  descriptor,
  editMode,
  onChangeType,
  onRemove,
}: {
  widget: DashboardWidgetConfig;
  descriptor: WidgetDescriptor;
  editMode: boolean;
  onChangeType: (id: string, type: DashboardWidgetType) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editMode,
  });

  return (
    <article
      ref={setNodeRef}
      className={`${styles.widget} ${isDragging ? styles.widgetDragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className={styles.widgetHeader}>
        <div>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}>{descriptor.title}</h3>
            <span className={styles.widgetCount}>{descriptor.total}</span>
          </div>
          <p className={styles.widgetDescription}>{descriptor.description}</p>
        </div>

        {editMode && (
          <div className={styles.widgetTools}>
            <button
              type="button"
              className={styles.dragHandle}
              aria-label={`Drag ${descriptor.title}`}
              {...attributes}
              {...listeners}
            >
              ⋮⋮
            </button>
            <select
              className={styles.widgetSelect}
              value={widget.type}
              onChange={(event) => onChangeType(widget.id, event.target.value as DashboardWidgetType)}
            >
              {WIDGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="button" className={styles.removeWidget} onClick={() => onRemove(widget.id)}>
              Remove
            </button>
          </div>
        )}
      </div>

      {descriptor.items.length === 0 ? (
        <p className={styles.widgetEmpty}>{descriptor.emptyLabel}</p>
      ) : (
        <ul className={styles.widgetList}>
          {descriptor.items.map((item) => (
            <li key={item.id} className={styles.widgetListItem}>
              <Link to={item.href} className={styles.widgetLink}>
                <span className={styles.widgetItemTitle}>{item.title}</span>
                <span className={styles.widgetItemMeta}>{item.meta}</span>
              </Link>
              {item.badge && (
                <span className={styles.widgetBadge}>{item.badge}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth(msalInstance);
  const [layout, setLayout] = useState<DashboardLayout>(() => readDashboardConfig().layout);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => readDashboardConfig().widgets);
  const [editMode, setEditMode] = useState(false);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [posts, setPosts] = useState<PageSummary[]>([]);
  const [courses, setCourses] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const displayName = user?.account.name ?? user?.account.username ?? 'there';
  const firstName = displayName.split(' ')[0] || 'there';
  const userIdentifiers = useMemo(() => getUserIdentifiers(user), [user]);

  useEffect(() => {
    window.localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({ layout, widgets }),
    );
  }, [layout, widgets]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      const results = await Promise.allSettled([
        listPages('page'),
        listPages('post'),
        listEditorCatalogueItems('PATH'),
      ]);

      if (cancelled) return;

      const nextErrors: string[] = [];

      if (results[0].status === 'fulfilled') {
        setPages(results[0].value);
      } else {
        nextErrors.push('Pages could not be loaded.');
      }

      if (results[1].status === 'fulfilled') {
        setPosts(results[1].value);
      } else {
        nextErrors.push('Posts could not be loaded.');
      }

      if (results[2].status === 'fulfilled') {
        setCourses(results[2].value.items);
      } else {
        nextErrors.push('Courses could not be loaded.');
      }

      setErrors(nextErrors);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const widgetDescriptors = useMemo(
    () =>
      widgets.map((widget) => ({
        widget,
        descriptor: getWidgetDescriptor(widget.type, pages, posts, courses, userIdentifiers),
      })),
    [widgets, pages, posts, courses, userIdentifiers],
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    setWidgets((current) => {
      const oldIndex = current.findIndex((item) => item.id === event.active.id);
      const newIndex = current.findIndex((item) => item.id === event.over?.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function handleAddWidget() {
    const nextType = WIDGET_OPTIONS[widgets.length % WIDGET_OPTIONS.length]?.value ?? 'recent-pages';
    setWidgets((current) => [
      ...current,
      { id: crypto.randomUUID(), type: nextType },
    ]);
  }

  function handleChangeWidgetType(id: string, type: DashboardWidgetType) {
    setWidgets((current) => current.map((widget) => (widget.id === id ? { ...widget, type } : widget)));
  }

  function handleRemoveWidget(id: string) {
    setWidgets((current) => (current.length > 1 ? current.filter((widget) => widget.id !== id) : current));
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Dashboard</span>
            <h1 className={styles.title}>Hello, {firstName}</h1>
            <p className={styles.subtitle}>
              Pick up where you left off, jump into content management, and tailor this dashboard to the work you do most.
            </p>

            <div className={styles.heroActions}>
              <Button onClick={() => navigate('/website/new')}>+ New page</Button>
              <Button variant="secondary" onClick={() => navigate('/blog-posts/new')}>+ New post</Button>
              <Button variant="secondary" onClick={() => navigate('/courses/new')}>+ New course</Button>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{pages.length}</span>
              <span className={styles.heroStatLabel}>Pages</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{posts.length}</span>
              <span className={styles.heroStatLabel}>Posts</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{courses.length}</span>
              <span className={styles.heroStatLabel}>Courses</span>
            </div>
          </div>
        </section>

        <section className={styles.widgetsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Widgets</h2>
              <p className={styles.sectionText}>
                Choose the content that matters most and arrange it however you like.
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.layoutControls}>
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`${styles.layoutButton} ${layout === count ? styles.layoutButtonActive : ''}`}
                    onClick={() => setLayout(count as DashboardLayout)}
                  >
                    {count} col
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={`${styles.editButton} ${editMode ? styles.editButtonActive : ''}`}
                onClick={() => setEditMode((current) => !current)}
              >
                {editMode ? 'Done editing' : 'Edit widgets'}
              </button>

              {editMode && (
                <button type="button" className={styles.addButton} onClick={handleAddWidget}>
                  + Add widget
                </button>
              )}
            </div>
          </div>

          {errors.length > 0 && (
            <div className={styles.errorBanner}>
              {errors.join(' ')}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>Loading dashboard…</div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
                <div
                  className={styles.widgetsGrid}
                  style={{ '--dashboard-columns': String(layout) } as CSSProperties}
                >
                  {widgetDescriptors.map(({ widget, descriptor }) => (
                    <SortableWidgetCard
                      key={widget.id}
                      widget={widget}
                      descriptor={descriptor}
                      editMode={editMode}
                      onChangeType={handleChangeWidgetType}
                      onRemove={handleRemoveWidget}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>
    </div>
  );
}
