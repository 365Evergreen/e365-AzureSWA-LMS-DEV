export interface CourseProperties {
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string;
  status: 'draft' | 'published';
  templateId: string;
  contentWidth?: string;
}

export const defaultCourseProperties: CourseProperties = {
  title: '',
  slug: '',
  description: '',
  featuredImageUrl: '',
  status: 'draft',
  templateId: 'content-page-fse',
};

