import { useEffect, useState } from 'react';
import type { CourseProperties } from '../CoursePropertiesPane/types';
import styles from './NavPropertiesSection.module.css';

interface NavParentOption {
  slug: string;
  label: string;
}

interface NavPropertiesSectionProps {
  properties: CourseProperties;
  onChange: (properties: CourseProperties) => void;
}

function useTopLevelNavItems(): NavParentOption[] {
  const [items, setItems] = useState<NavParentOption[]>([]);
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    fetch(`${base}/api/nav`)
      .then((r) => r.ok ? r.json() as Promise<NavParentOption[]> : [])
      .then((data) => setItems(data.filter((i: NavParentOption) => i.slug)))
      .catch(() => setItems([]));
  }, []);
  return items;
}

export default function NavPropertiesSection({ properties, onChange }: NavPropertiesSectionProps) {
  const parentOptions = useTopLevelNavItems();

  function update<K extends keyof CourseProperties>(key: K, value: CourseProperties[K]) {
    onChange({ ...properties, [key]: value });
  }

  function handleToggle(checked: boolean) {
    onChange({
      ...properties,
      inNav: checked,
      navLabel: checked && !properties.navLabel ? properties.title : properties.navLabel,
    });
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Navigation</h2>

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={properties.inNav}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <span className={styles.toggleLabel}>Include in navigation</span>
      </label>

      {properties.inNav && (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="nav-label">Nav label</label>
            <input
              id="nav-label"
              className={styles.input}
              type="text"
              placeholder={properties.title || 'Label shown in nav'}
              value={properties.navLabel}
              onChange={(e) => update('navLabel', e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nav-parent">Parent item</label>
              <select
                id="nav-parent"
                className={styles.select}
                value={properties.navParent}
                onChange={(e) => update('navParent', e.target.value)}
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldNarrow}>
              <label className={styles.label} htmlFor="nav-order">Order</label>
              <input
                id="nav-order"
                className={styles.input}
                type="number"
                min={0}
                value={properties.navOrder}
                onChange={(e) => update('navOrder', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
