import { useEffect, useState } from 'react';
import type { BlogCategory } from '@lms/shared-schemas';
import type { CourseProperties } from './types';
import type { CreateBlogCategoryRequest } from '../../api/pages';
import { loadEditorCatalogueItem } from '../../api/catalogue';
import CourseSelectorModal from '../CourseSelectorModal';
import BlogCategoryPicker from '../BlogCategoryPicker';
import type { SelectedCourse } from '../CourseSelectorModal';
import styles from './CoursePropertiesPane.module.css';

interface CoursePropertiesPaneProps {
  contentType?: 'page' | 'post' | 'knowledge';
  properties: CourseProperties;
  onChange: (properties: CourseProperties) => void;
  categories?: BlogCategory[];
  categoriesLoading?: boolean;
  categoriesError?: string | null;
  onCreateCategory?: (request: CreateBlogCategoryRequest) => Promise<BlogCategory>;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toDateTimeLocalValue(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export default function CoursePropertiesPane({
  contentType = 'page',
  properties,
  onChange,
  categories = [],
  categoriesLoading = false,
  categoriesError = null,
  onCreateCategory,
}: CoursePropertiesPaneProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [linkedCourseMeta, setLinkedCourseMeta] = useState<{ level: string; role: string; tags: string } | null>(null);
  const isLinkedCourseTemplate = ['course-overview', 'course-landing'].includes(properties.templateId);

  useEffect(() => {
    if (!isLinkedCourseTemplate || !properties.linkedCourseId) {
      setLinkedCourseMeta(null);
      return;
    }

    let cancelled = false;
    loadEditorCatalogueItem('PATH', properties.linkedCourseId)
      .then((course) => {
        if (cancelled) return;
        setLinkedCourseMeta({
          level: course.difficulty ?? '',
          role: course.role ?? '',
          tags: course.tagsCsv
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .join(', '),
        });
      })
      .catch(() => {
        if (!cancelled) setLinkedCourseMeta(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isLinkedCourseTemplate, properties.linkedCourseId]);

  function update<K extends keyof CourseProperties>(key: K, value: CourseProperties[K]) {
    onChange({ ...properties, [key]: value });
  }

  // Auto-generate slug from title if slug hasn't been manually edited
  function handleTitleChange(value: string) {
    const autoSlug = slugify(value);
    onChange({
      ...properties,
      title: value,
      slug: properties.slug === slugify(properties.title) ? autoSlug : properties.slug,
    });
  }

  function handleCourseSelected(course: SelectedCourse) {
    onChange({
      ...properties,
      linkedCourseId: course.itemId,
      linkedCourseSlug: course.slug,
      linkedCourseTitle: course.title,
    });
    setSelectorOpen(false);
  }

  return (
    <div className={styles.pane}>
      <h2 className={styles.heading}>Content Properties</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="course-title">Title</label>
        <input
          id="course-title"
          className={styles.input}
          type="text"
          placeholder="e.g. Introduction to Azure"
          value={properties.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="course-slug">
          Slug
          <span className={styles.hint}>URL-safe identifier</span>
        </label>
        <input
          id="course-slug"
          className={styles.input}
          type="text"
          placeholder="e.g. intro-to-azure"
          value={properties.slug}
          onChange={(e) => update('slug', slugify(e.target.value))}
        />
        {properties.slug && (
          <span className={styles.slugPreview}>/{properties.slug}</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          className={styles.textarea}
          placeholder="A short description shown in the course catalogue"
          rows={4}
          value={properties.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="course-image">
          Featured Image URL
          <span className={styles.hint}>Displayed on catalogue card</span>
        </label>
        <input
          id="course-image"
          className={styles.input}
          type="url"
          placeholder="https://..."
          value={properties.featuredImageUrl}
          onChange={(e) => update('featuredImageUrl', e.target.value)}
        />
        {properties.featuredImageUrl && (
          <img
            src={properties.featuredImageUrl}
            alt="Featured"
            className={styles.imagePreview}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Status</label>
        <div className={styles.statusGroup}>
          {(['draft', 'published'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.statusBtn} ${properties.status === s ? styles.statusBtnActive : ''}`}
              onClick={() => update('status', s)}
            >
              <span className={`${styles.statusDot} ${styles[s]}`} />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {contentType === 'post' && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="post-published-at">
            Publish date
            <span className={styles.hint}>Used when publishing; back-dating is allowed</span>
          </label>
          <input
            id="post-published-at"
            className={styles.input}
            type="datetime-local"
            value={toDateTimeLocalValue(properties.publishedAt)}
            onChange={(e) => update('publishedAt', fromDateTimeLocalValue(e.target.value))}
          />
        </div>
      )}

      {contentType === 'post' && onCreateCategory && (
        <BlogCategoryPicker
          categories={categories}
          selectedIds={properties.categoryIds}
          primaryCategoryId={properties.primaryCategoryId}
          loading={categoriesLoading}
          error={categoriesError}
          onCreateCategory={onCreateCategory}
          onChange={(categoryIds, primaryCategoryId) =>
            onChange({ ...properties, categoryIds, primaryCategoryId })
          }
        />
      )}

      {isLinkedCourseTemplate && (
        <div className={styles.field}>
          <label className={styles.label}>
            Linked course
            <span className={styles.hint}>Associates this page with a course</span>
          </label>
          {properties.linkedCourseId ? (
            <div className={styles.linkedCourse}>
              <div className={styles.linkedCourseInfo}>
                <span className={styles.linkedCourseTitle}>{properties.linkedCourseTitle}</span>
                <span className={styles.linkedCourseSlug}>/{properties.linkedCourseSlug}</span>
              </div>
              <button
                type="button"
                className={styles.changeCourseBtn}
                onClick={() => setSelectorOpen(true)}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.selectCourseBtn}
              onClick={() => setSelectorOpen(true)}
            >
              Select course…
            </button>
          )}
        </div>
      )}

      {isLinkedCourseTemplate && (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Course level</label>
            <input
              className={styles.input}
              type="text"
              value={linkedCourseMeta?.level ?? ''}
              readOnly
              placeholder="Synced from linked course"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Course role</label>
            <input
              className={styles.input}
              type="text"
              value={linkedCourseMeta?.role ?? ''}
              readOnly
              placeholder="Synced from linked course"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Course tags</label>
            <input
              className={styles.input}
              type="text"
              value={linkedCourseMeta?.tags ?? ''}
              readOnly
              placeholder="Synced from linked course"
            />
          </div>
        </>
      )}

      {selectorOpen && (
        <CourseSelectorModal
          currentCourseId={properties.linkedCourseId}
          onSelect={handleCourseSelected}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}
