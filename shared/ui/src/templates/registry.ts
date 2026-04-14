export type TemplateCategory = 'page' | 'post' | 'course';

export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  category: TemplateCategory;
  layout: 'landing' | 'content-fse' | 'content-left-sidebar' | 'content-right-sidebar' | 'search-results' | 'post';
  hasSidebar: boolean;
}

export const templates: TemplateDefinition[] = [
  {
    id: 'landing-page',
    label: 'Landing page',
    description: 'Full-width single-column layout. Ideal for hero-driven marketing and campaign pages. Content spans the full viewport width by default.',
    category: 'page',
    layout: 'landing',
    hasSidebar: false,
  },
  {
    id: 'content-page-fse',
    label: 'Content page',
    description: 'Centred content-width layout. Best for articles, documentation, and general-purpose pages where readability is the priority.',
    category: 'page',
    layout: 'content-fse',
    hasSidebar: false,
  },
  {
    id: 'content-page-left-sidebar',
    label: 'Content page — left sidebar',
    description: 'Main content area with a left-hand sidebar. Use the sidebar for navigation, filters, or supplementary links.',
    category: 'page',
    layout: 'content-left-sidebar',
    hasSidebar: true,
  },
  {
    id: 'content-page-right-sidebar',
    label: 'Content page — right sidebar',
    description: 'Main content area with a right-hand sidebar. Use the sidebar for related content, a table of contents, or calls to action.',
    category: 'page',
    layout: 'content-right-sidebar',
    hasSidebar: true,
  },
  {
    id: 'search-results',
    label: 'Search results',
    description: 'Full-width layout with fixed search result components. Reserved for search result pages — not freely editable.',
    category: 'page',
    layout: 'search-results',
    hasSidebar: false,
  },
  {
    id: 'post',
    label: 'Post',
    description: 'Prose-width layout with a metadata header (title, date, tags). Used for blog posts and news articles.',
    category: 'post',
    layout: 'post',
    hasSidebar: false,
  },
  {
    id: 'course-overview',
    label: 'Course overview',
    description: 'Content-width layout for course overview pages. Shows a course hero, description, curriculum outline, and enrolment call to action. Mirrors the content page layout.',
    category: 'page',
    layout: 'content-fse',
    hasSidebar: false,
  },
  {
    id: 'course-landing',
    label: 'Course landing',
    description: 'Full-width hero with centred single-column content. Includes a course info table, summary content, and a stacked module-card section driven by the linked course.',
    category: 'page',
    layout: 'content-fse',
    hasSidebar: false,
  },
  {
    id: 'archive-header',
    label: 'Archive header',
    description: 'Header-only layout for blog and course listing pages. Editors configure the hero and intro text; the listing content below is always rendered by the application. Use reserved slugs: archive-blog, archive-courses.',
    category: 'page',
    layout: 'landing',
    hasSidebar: false,
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateDefinition['category']): TemplateDefinition[] {
  return templates.filter((t) => t.category === category);
}
