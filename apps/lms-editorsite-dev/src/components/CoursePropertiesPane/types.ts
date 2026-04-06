export interface CourseProperties {
  title: string;
  slug: string;
  description: string;
  featuredImageUrl: string;
  status: 'draft' | 'published';
}

export const defaultCourseProperties: CourseProperties = {
  title: '',
  slug: '',
  description: '',
  featuredImageUrl: '',
  status: 'draft',
};
