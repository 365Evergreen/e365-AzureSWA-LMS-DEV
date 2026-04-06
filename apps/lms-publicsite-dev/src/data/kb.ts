export type KBAudience = 'editor' | 'learner' | 'both';
export type KBVersion = 'current' | 'previous';

export interface KBArticle {
  title: string;
  slug: string;
  excerpt: string;
  audience: KBAudience;
  version: KBVersion;
  body: string;
}

export const kbArticles: KBArticle[] = [
  {
    title: 'Creating Your First Course',
    slug: 'creating-your-first-course',
    excerpt: 'Step-by-step walkthrough for editors building a course from scratch using the block editor.',
    audience: 'editor',
    version: 'current',
    body: 'Open the Editor dashboard and click "New Course". Give your course a title, then start adding blocks from the block library. Arrange them with drag-and-drop, fill in your content, and hit Publish when ready.',
  },
  {
    title: 'Navigating Your Learning Dashboard',
    slug: 'navigating-learning-dashboard',
    excerpt: 'How learners can find enrolled courses, track progress, and resume where they left off.',
    audience: 'learner',
    version: 'current',
    body: 'Log in and you will be taken straight to your dashboard. Your enrolled courses appear in the "My Courses" panel. Click any course to resume from your last position. Progress bars show how far through each module you have come.',
  },
  {
    title: 'Managing Course Versions',
    slug: 'managing-course-versions',
    excerpt: 'Learn how to publish, archive, and roll back course versions using the version manager.',
    audience: 'editor',
    version: 'current',
    body: 'Every time you publish a course a snapshot is saved. Access the Version Manager from the course settings menu. You can compare versions side-by-side, restore a previous snapshot, or archive a version to hide it from learners while retaining the history.',
  },
  {
    title: 'Completing Assessments',
    slug: 'completing-assessments',
    excerpt: 'A guide for learners on how to take quizzes, submit assignments, and view feedback.',
    audience: 'learner',
    version: 'current',
    body: 'Assessments appear as blocks within a course. Click "Start Assessment" to begin. Multiple-choice questions are scored immediately; written submissions are queued for instructor review. Check your Grades panel for results and feedback.',
  },
  {
    title: 'Block Library Reference (v1)',
    slug: 'block-library-reference-v1',
    excerpt: 'Complete reference for all block types available in platform version 1, for editors.',
    audience: 'editor',
    version: 'previous',
    body: 'Version 1 of the platform included Text, Image, Video, Quiz, and File Download blocks. Each block had a fixed set of properties configurable through the sidebar. Note: the Embed block was added in v2 and is not available in this version.',
  },
  {
    title: 'Getting Help as a Learner',
    slug: 'getting-help-learner',
    excerpt: 'Find out how to contact your instructor, raise a support ticket, or access community forums.',
    audience: 'both',
    version: 'current',
    body: 'For course-specific questions, use the "Ask Instructor" button on the course page. For platform issues, open a support ticket from the Help menu in the top navigation. Community forums are available at community.lms-platform.example.',
  },
];