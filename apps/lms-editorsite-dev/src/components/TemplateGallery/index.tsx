import { getTemplatesByCategory } from '@lms/shared-ui';
import type { TemplateDefinition } from '@lms/shared-ui';
import styles from './TemplateGallery.module.css';

interface TemplateGalleryProps {
  category: TemplateDefinition['category'];
  onSelect: (templateId: string) => void;
  onCancel: () => void;
}

const layoutDiagrams: Record<string, string> = {
  landing:                '▬▬▬▬▬▬▬▬▬▬',
  'content-fse':          '  ▬▬▬▬▬▬  ',
  'content-left-sidebar': '▐▌ ▬▬▬▬▬▬ ',
  'content-right-sidebar':'  ▬▬▬▬▬▬ ▐▌',
  'search-results':       '▬ ▬▬▬▬▬▬▬ ▬',
  post:                   '   ▬▬▬▬   ',
};

export default function TemplateGallery({ category, onSelect, onCancel }: TemplateGalleryProps) {
  const templates = getTemplatesByCategory(category);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose a template</h2>
          <p className={styles.subtitle}>
            Select a layout for your new {category}. You can change this later from the Layout tab.
          </p>
        </div>
        <div className={styles.grid}>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.card}
              onClick={() => onSelect(template.id)}
            >
              <div className={styles.diagram} aria-hidden>
                {layoutDiagrams[template.layout] ?? '▬▬▬▬▬▬'}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardLabel}>{template.label}</span>
                <span className={styles.cardDesc}>{template.description}</span>
              </div>
            </button>
          ))}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
