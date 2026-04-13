import type { ReactElement } from 'react';

export function DashboardIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="6" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function CoursesIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6.5C5.333 5.833 7.333 5 12 5s6.667.833 8 1.5v11c-1.333.667-3.333 1.5-8 1.5s-6.667-.833-8-1.5v-11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 8v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function KnowledgeBaseIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a6 6 0 00-3 11.196V16l3 2 3-2v-2.804A6 6 0 0012 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WebsiteIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12h20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M12 2a20 20 0 010 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function BlogIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a1 1 0 01-1 1H6l-4-4V6a1 1 0 011-1h14a1 1 0 011 1v9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 8h10M7 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MediaIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 14l3-3 4 4 3-4 3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export const ICONS_MAP: Record<string, ReactElement> = {
  '/dashboard': <DashboardIcon />,
  '/courses': <CoursesIcon />,
  '/knowledge-base': <KnowledgeBaseIcon />,
  '/website': <WebsiteIcon />,
  '/blog-posts': <BlogIcon />,
  '/media': <MediaIcon />,
};
