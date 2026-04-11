import { getTemplate } from '@lms/shared-ui';
import type { TemplateDefinition } from '@lms/shared-ui';
import styles from './LayoutPropertiesPane.module.css';

interface LayoutPropertiesPaneProps {
  templateId: string;
  contentWidth?: string;
  onChangeTemplate: () => void;
  onContentWidthChange: (width: string | undefined) => void;
}

export default function LayoutPropertiesPane({
  templateId,
  contentWidth,
  onChangeTemplate,
  onContentWidthChange,
}: LayoutPropertiesPaneProps) {
  const template: TemplateDefinition | undefined = getTemplate(templateId);

  return (
    <div className={styles.pane}>
      <h2 className={styles.heading}>Layout</h2>

      <div className={styles.field}>
        <label className={styles.label}>Template</label>
        <div className={styles.templateDisplay}>
          <span className={styles.templateName}>{template?.label ?? templateId}</span>
          <button type="button" className={styles.changeBtn} onClick={onChangeTemplate}>
            Change
          </button>
        </div>
        {template && (
          <p className={styles.templateDesc}>{template.description}</p>
        )}
      </div>

      {templateId === 'landing-page' && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="content-width">
            Content width
            <span className={styles.hint}>e.g. 100vw, 1400px, 80%</span>
          </label>
          <input
            id="content-width"
            className={styles.input}
            type="text"
            placeholder="100vw"
            value={contentWidth ?? ''}
            onChange={(e) => onContentWidthChange(e.target.value || undefined)}
          />
        </div>
      )}

      {template?.hasSidebar && (
        <div className={styles.notice}>
          <span className={styles.noticeIcon}>ℹ</span>
          <span>
            This layout has a sidebar zone. Sidebar blocks appear alongside the main content in the canvas preview.
          </span>
        </div>
      )}
    </div>
  );
}
