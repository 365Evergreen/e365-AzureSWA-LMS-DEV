export interface Course {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'published';
  lastEdited: string;
}

export const courses: Course[] = [
  { id: '1', title: 'Introduction to TypeScript', status: 'published', lastEdited: '2025-01-10' },
  { id: '2', title: 'React Fundamentals', status: 'draft', lastEdited: '2025-01-15' },
  { id: '3', title: 'Advanced CSS Techniques', status: 'review', lastEdited: '2025-01-18' },
  { id: '4', title: 'Node.js for Beginners', status: 'draft', lastEdited: '2025-01-20' },
];
