import type { ContentBundle } from '@lms/shared-schemas';

export interface MockCourse {
  id: string;
  title: string;
  description: string;
  bundleId: string;
  progress: number; // 0-100
  enrolled: boolean;
}

export const mockCourses: MockCourse[] = [
  {
    id: 'course-001',
    title: 'Introduction to TypeScript',
    description:
      'Learn the fundamentals of TypeScript, from basic types to advanced generics and decorators.',
    bundleId: 'bundle-001',
    progress: 75,
    enrolled: true,
  },
  {
    id: 'course-002',
    title: 'Next.js App Router Deep Dive',
    description:
      'Master the Next.js 13+ App Router, Server Components, and streaming patterns.',
    bundleId: 'bundle-002',
    progress: 30,
    enrolled: true,
  },
  {
    id: 'course-003',
    title: 'Azure Entra ID & MSAL',
    description:
      'Integrate Microsoft Entra ID authentication into your web applications using MSAL.',
    bundleId: 'bundle-003',
    progress: 0,
    enrolled: true,
  },
  {
    id: 'course-004',
    title: 'Advanced CSS Architecture',
    description:
      'Design scalable CSS systems using design tokens, CSS Modules, and custom properties.',
    bundleId: 'bundle-004',
    progress: 0,
    enrolled: false,
  },
];

export function getMockBundle(courseId: string): ContentBundle {
  const course = mockCourses.find((c) => c.id === courseId);
  const title = course?.title ?? 'Unknown Course';

  return {
    bundleId: '20000000-0000-0000-0000-000000000001',
    courseId: '30000000-0000-0000-0000-000000000001',
    platformVersion: '1.0.0',
    publishedAt: new Date().toISOString(),
    publishedBy: 'system',
    metadata: {
      title,
      description: course?.description,
      audienceRoles: ['Learner'],
    },
    blocks: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        type: 'heading',
        version: 1,
        payload: { text: title, level: 1 },
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        type: 'paragraph',
        version: 1,
        payload: {
          html: `<p>Welcome to <strong>${title}</strong>. This course covers all the essential concepts you need to get started.</p>`,
        },
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        type: 'callout',
        version: 1,
        payload: {
          type: 'info',
          title: 'Before you begin',
          body: 'Make sure you have a basic understanding of JavaScript and web development before starting this course.',
        },
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        type: 'heading',
        version: 1,
        payload: { text: 'Module 1: Getting Started', level: 2 },
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        type: 'code',
        version: 1,
        payload: {
          language: 'typescript',
          filename: 'example.ts',
          code: `// Example code\nconst greeting = (name: string): string => {\n  return \`Hello, \${name}!\`;\n};\n\nconsole.log(greeting('Learner'));`,
        },
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        type: 'quiz',
        version: 1,
        payload: {
          question: 'Which of the following best describes this course?',
          options: [
            { id: 'a', label: 'A beginner-friendly introduction' },
            { id: 'b', label: 'An advanced deep-dive' },
            { id: 'c', label: 'A practical hands-on workshop' },
            { id: 'd', label: 'A certification programme' },
          ],
          correctOptionId: 'a',
          explanation: 'This course is designed as a beginner-friendly introduction.',
        },
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        type: 'divider',
        version: 1,
        payload: {},
      },
      {
        id: '10000000-0000-0000-0000-000000000008',
        type: 'callout',
        version: 1,
        payload: {
          type: 'tip',
          title: 'Pro tip',
          body: 'Practice what you learn by building small projects alongside the course material.',
        },
      },
    ],
  };
}
