import type { ReactNode } from 'react';
import { LandingLayout, ContentLayout, PostLayout, getTemplate } from '@lms/shared-ui';
import styles from './CanvasLayoutPreview.module.css';

interface CanvasLayoutPreviewProps {
  templateId: string;
  contentWidth?: string;
  children: ReactNode;
}

function SidebarPlaceholder() {
  return (
    <div className={styles.sidebarPlaceholder}>
      <span className={styles.sidebarLabel}>Sidebar zone</span>
      <p className={styles.sidebarHint}>Sidebar content comes from the published template configuration.</p>
    </div>
  );
}

export default function CanvasLayoutPreview({ templateId, contentWidth, children }: CanvasLayoutPreviewProps) {
  const template = getTemplate(templateId);

  const label = template?.label ?? templateId;

  const inner = (() => {
    switch (templateId) {
      case 'landing-page':
        return (
          <LandingLayout contentWidth={contentWidth}>
            {children}
          </LandingLayout>
        );
      case 'content-page-fse':
        return (
          <ContentLayout variant="fse">
            {children}
          </ContentLayout>
        );
      case 'content-page-left-sidebar':
        return (
          <ContentLayout variant="left-sidebar" sidebar={<SidebarPlaceholder />}>
            {children}
          </ContentLayout>
        );
      case 'content-page-right-sidebar':
        return (
          <ContentLayout variant="right-sidebar" sidebar={<SidebarPlaceholder />}>
            {children}
          </ContentLayout>
        );
      case 'post':
        return (
          <PostLayout>
            {children}
          </PostLayout>
        );
      case 'search-results':
        return (
          <ContentLayout variant="fse">
            <div className={styles.searchResultsNotice}>
              Search results template — components are hardcoded in the delivery app.
            </div>
            {children}
          </ContentLayout>
        );
      default:
        return <>{children}</>;
    }
  })();

  return (
    <div className={styles.root}>
      <div className={styles.templateBadge}>{label}</div>
      <div className={styles.preview}>
        {inner}
      </div>
    </div>
  );
}
