import { useMemo, useState } from 'react';
import type { BlogCategory } from '@lms/shared-schemas';
import type { CreateBlogCategoryRequest } from '../../api/pages';
import styles from './BlogCategoryPicker.module.css';

interface BlogCategoryPickerProps {
  categories: BlogCategory[];
  selectedIds: string[];
  primaryCategoryId?: string;
  loading?: boolean;
  error?: string | null;
  onChange: (categoryIds: string[], primaryCategoryId?: string) => void;
  onCreateCategory: (request: CreateBlogCategoryRequest) => Promise<BlogCategory>;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogCategoryPicker({
  categories,
  selectedIds,
  primaryCategoryId,
  loading = false,
  error,
  onChange,
  onCreateCategory,
}: BlogCategoryPickerProps) {
  const [draftName, setDraftName] = useState('');
  const [draftParentId, setDraftParentId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.path.localeCompare(b.path) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
      ),
    [categories]
  );

  function handleToggle(categoryId: string, checked: boolean) {
    const nextCategoryIds = checked
      ? Array.from(new Set([...selectedIds, categoryId]))
      : selectedIds.filter((id) => id !== categoryId);
    const nextPrimary =
      checked
        ? (primaryCategoryId ?? categoryId)
        : primaryCategoryId === categoryId
          ? nextCategoryIds[0]
          : primaryCategoryId;
    onChange(nextCategoryIds, nextPrimary);
  }

  async function handleCreate() {
    const name = draftName.trim();
    if (!name) {
      setCreateError('Enter a category name.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const category = await onCreateCategory({
        taxonomy: 'post',
        name,
        slug: slugify(name),
        parentId: draftParentId || undefined,
      });
      const nextCategoryIds = Array.from(new Set([...selectedIds, category.categoryId]));
      onChange(nextCategoryIds, primaryCategoryId ?? category.categoryId);
      setDraftName('');
      setDraftParentId('');
    } catch (createCategoryError) {
      setCreateError(createCategoryError instanceof Error ? createCategoryError.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Categories</h3>
          <p className={styles.help}>Assign categories to this post and choose a primary one.</p>
        </div>
      </div>

      {loading && <p className={styles.message}>Loading categories…</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.tree}>
          {sortedCategories.length === 0 ? (
            <p className={styles.message}>No categories yet. Create the first one below.</p>
          ) : (
            sortedCategories.map((category) => {
              const selected = selectedIds.includes(category.categoryId);
              return (
                <div
                  key={category.categoryId}
                  className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
                  style={{ paddingLeft: `${category.depth * 16}px` }}
                >
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => handleToggle(category.categoryId, event.target.checked)}
                    />
                    <span className={styles.name}>{category.name}</span>
                  </label>
                  <label className={styles.primaryLabel}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      checked={primaryCategoryId === category.categoryId}
                      disabled={!selected}
                      onChange={() => onChange(selectedIds, category.categoryId)}
                    />
                    <span>Primary</span>
                  </label>
                  <span className={styles.path}>{category.path}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className={styles.createBox}>
        <label className={styles.field}>
          <span className={styles.label}>New category</span>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Azure Fundamentals"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Parent category</span>
          <select
            className={styles.select}
            value={draftParentId}
            onChange={(event) => setDraftParentId(event.target.value)}
          >
            <option value="">None (top level)</option>
            {sortedCategories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
                {'-- '.repeat(category.depth)}
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {createError && <p className={styles.error}>{createError}</p>}

        <button
          type="button"
          className={styles.createButton}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Creating…' : 'Add category'}
        </button>
      </div>
    </div>
  );
}
