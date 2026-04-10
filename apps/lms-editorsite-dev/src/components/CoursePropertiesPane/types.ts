export interface CourseProperties {
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string;
  status: 'draft' | 'published';
  templateId: string;
  contentWidth?: string;
  // Course overview link (course-overview template only)
  linkedCourseId?: string;
  linkedCourseSlug?: string;
  linkedCourseTitle?: string;
  // Navigation (web pages only)
  inNav: boolean;
  navLabel: string;
  navParent: string;
  navOrder: number;
}

export const defaultCourseProperties: CourseProperties = {
  title: '',
  slug: '',
  description: '',
  featuredImageUrl: '',
  status: 'draft',
  templateId: 'content-page-fse',
  linkedCourseId: undefined,
  linkedCourseSlug: undefined,
  linkedCourseTitle: undefined,
  inNav: false,
  navLabel: '',
  navParent: '',
  navOrder: 0,
};

