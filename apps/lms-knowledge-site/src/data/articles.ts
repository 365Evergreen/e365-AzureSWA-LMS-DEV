export interface KBArticle {
  slug: string
  title: string
  excerpt: string
  audience: 'editor' | 'learner' | 'both'
  version: 'current' | 'previous'
  tags: string[]
  body: string
}

export const articles: KBArticle[] = [
  {
    slug: 'getting-started-with-courses',
    title: 'Getting Started with Courses',
    excerpt: 'Learn how to create and publish your first course on the platform.',
    audience: 'editor',
    version: 'current',
    tags: ['courses', 'getting-started', 'editor'],
    body: `# Getting Started with Courses

Welcome to the LMS platform! This guide walks you through creating and publishing your first course.

## Creating a New Course

Navigate to the **Editor Dashboard** and click **New Course**. Fill in the course title, description, and select a category. You can also set a thumbnail image to make your course stand out in the catalog.

## Adding Lessons

Once your course is created, add lessons by clicking **Add Lesson** in the course builder. Each lesson can contain video, text content, quizzes, and attachments.

\`\`\`js
// Example: Course configuration object
const courseConfig = {
  title: 'Introduction to JavaScript',
  category: 'programming',
  level: 'beginner',
  published: false,
}
\`\`\`

## Publishing Your Course

When you're satisfied with your content, click **Publish**. Your course will go through a brief review before appearing in the learner catalog.

> **Tip:** Complete all required fields (title, description, at least one lesson) before attempting to publish. Incomplete courses cannot be published.

## Next Steps

After publishing, monitor learner progress from the **Analytics** tab and respond to questions in the **Discussion** section.`,
  },
  {
    slug: 'navigating-the-learner-dashboard',
    title: 'Navigating the Learner Dashboard',
    excerpt: 'Discover how to find courses, track your progress, and earn certificates.',
    audience: 'learner',
    version: 'current',
    tags: ['dashboard', 'learner', 'progress', 'certificates'],
    body: `# Navigating the Learner Dashboard

Your learner dashboard is the central hub for all your learning activity. Here's a tour of the key sections.

## My Courses

The **My Courses** panel shows all courses you're enrolled in, along with your current progress percentage. Click any course tile to resume where you left off.

## Progress Tracking

Progress is automatically saved as you complete lessons. The progress bar updates in real time.

\`\`\`
Course Progress Calculation:
  completed_lessons / total_lessons × 100 = progress%
\`\`\`

## Certificates

When you complete all lessons in a course with a passing grade, your certificate is automatically generated and available for download under **My Certificates**.

> **Note:** Certificates are only awarded for courses with a final assessment. Not all courses include assessments.

## Search and Discovery

Use the **Explore** tab to discover new courses. Filter by category, difficulty level, or duration to find content that fits your schedule and goals.`,
  },
  {
    slug: 'quiz-builder-guide',
    title: 'Quiz Builder Guide',
    excerpt: 'Build engaging assessments using the quiz builder: question types, scoring, and feedback.',
    audience: 'editor',
    version: 'current',
    tags: ['quiz', 'assessment', 'editor', 'scoring'],
    body: `# Quiz Builder Guide

The quiz builder lets you create engaging assessments with multiple question types.

## Question Types

The platform supports four question types:

- **Multiple Choice** – one correct answer from a list
- **Multi-Select** – one or more correct answers
- **True / False** – binary choice
- **Short Answer** – text input with keyword matching

## Configuring Scoring

Each question can have a custom point value. Set a passing threshold as a percentage of total points.

\`\`\`json
{
  "quiz": {
    "passingScore": 70,
    "questions": [
      { "type": "multiple-choice", "points": 10 },
      { "type": "true-false", "points": 5 }
    ]
  }
}
\`\`\`

## Feedback Messages

Configure feedback for both correct and incorrect answers. Learners see the feedback immediately after each question if you enable **Instant Feedback** mode.

> **Best practice:** Write clear, constructive feedback that explains *why* an answer is correct or incorrect — not just whether it is.

## Randomisation

Enable **Shuffle Questions** and **Shuffle Answers** to reduce the chance of learners sharing answers with each other.`,
  },
  {
    slug: 'enrolling-in-a-course',
    title: 'Enrolling in a Course',
    excerpt: 'How to browse the catalog, enroll in a course, and get started learning.',
    audience: 'learner',
    version: 'current',
    tags: ['enrollment', 'catalog', 'learner'],
    body: `# Enrolling in a Course

Finding and enrolling in a course is quick and straightforward.

## Browsing the Catalog

Open the **Explore** page to browse available courses. You can filter by:

- Category (e.g., Programming, Design, Business)
- Difficulty level (Beginner, Intermediate, Advanced)
- Duration

## Enrolling

Click on a course card to view the course details page. Review the curriculum, instructor information, and learner reviews. Click **Enroll Now** to add the course to your dashboard.

\`\`\`
Steps to enroll:
  1. Go to Explore
  2. Select a course
  3. Click "Enroll Now"
  4. Confirm enrollment
  5. Start learning!
\`\`\`

## Self-Paced vs. Instructor-Led

Some courses are **self-paced** — you work through them on your own schedule. Others are **instructor-led** with fixed start dates and deadlines.

> **Heads up:** Instructor-led courses may have prerequisites. Check the course page before enrolling to ensure you have the required background.`,
  },
  {
    slug: 'managing-course-settings',
    title: 'Managing Course Settings (v1 — Legacy)',
    excerpt: 'Legacy guide for the old course settings panel, applicable to platform version 1.x.',
    audience: 'editor',
    version: 'previous',
    tags: ['courses', 'settings', 'legacy', 'v1'],
    body: `# Managing Course Settings (v1 — Legacy)

> **Note:** This article applies to platform version 1.x. If you are on version 2.x or later, refer to the current documentation.

## Accessing Settings

In v1, course settings were accessed via the **three-dot menu** on the course card in the editor dashboard.

## Available Settings

The v1 settings panel offered:

- **Title and description** editing
- **Category** selection
- **Visibility** (Draft, Published, Archived)
- **Enrollment type** (Open, Invite-only)

\`\`\`
Legacy API endpoint (v1):
  PUT /api/v1/courses/:id/settings
  Content-Type: application/json
\`\`\`

## Migrating to v2

In v2, the settings panel was redesigned into a tabbed interface. Your existing courses were automatically migrated. You may need to review and re-save settings for courses created before the migration.

> **Important:** The old \`/api/v1/\` endpoints are deprecated and will be removed in a future release. Update any integrations to use \`/api/v2/\`.`,
  },
  {
    slug: 'video-upload-and-processing',
    title: 'Video Upload and Processing',
    excerpt: 'Upload course videos, understand processing times, and troubleshoot common issues.',
    audience: 'both',
    version: 'current',
    tags: ['video', 'upload', 'processing', 'troubleshooting'],
    body: `# Video Upload and Processing

This guide covers video upload for editors and explains what learners see during video processing.

## Supported Formats

The platform accepts the following video formats:

- MP4 (H.264 / H.265)
- MOV
- AVI
- WebM

Maximum file size is **4 GB** per video.

\`\`\`
Recommended encoding settings:
  Codec:      H.264
  Resolution: 1920×1080 (1080p)
  Bitrate:    8 Mbps
  Frame rate: 30fps
  Audio:      AAC, 192 kbps
\`\`\`

## Upload Process

Drag and drop your video file onto the lesson editor, or click **Upload Video** to browse your files. A progress bar tracks the upload. Once uploaded, the video enters the **processing queue**.

## Processing Times

Processing time depends on file size and server load. Typical processing takes **2–10 minutes** for a 1080p video. The lesson shows a "Processing…" indicator to learners until the video is ready.

> **If processing takes longer than 30 minutes**, the upload may have failed. Delete the video, check your file format, and try again.`,
  },
  {
    slug: 'accessibility-features',
    title: 'Accessibility Features',
    excerpt: 'Overview of built-in accessibility features including captions, keyboard navigation, and screen reader support.',
    audience: 'both',
    version: 'current',
    tags: ['accessibility', 'a11y', 'captions', 'keyboard'],
    body: `# Accessibility Features

The LMS platform is built with accessibility at its core, supporting learners and editors who rely on assistive technology.

## Captions and Transcripts

All video lessons support **closed captions**. Editors can upload a VTT caption file alongside their video. Auto-generated captions are available but should be reviewed for accuracy.

\`\`\`vtt
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to Introduction to JavaScript.

00:00:04.500 --> 00:00:08.000
In this lesson, we'll cover variables and data types.
\`\`\`

## Keyboard Navigation

The platform is fully navigable by keyboard:

- **Tab** – move to the next interactive element
- **Shift+Tab** – move to the previous element
- **Enter / Space** – activate buttons and links
- **Arrow keys** – navigate within menus and tabs

## Screen Reader Support

All interactive elements have descriptive ARIA labels. Video players announce playback status. Quiz questions are properly associated with their answer options using ARIA.

> **For editors:** When adding images to lesson content, always fill in the **alt text** field. Decorative images should use an empty alt attribute (\`alt=""\`).`,
  },
  {
    slug: 'legacy-grade-book',
    title: 'Using the Grade Book (v1 — Legacy)',
    excerpt: 'Guide to the v1 grade book interface for tracking learner scores and issuing manual grades.',
    audience: 'editor',
    version: 'previous',
    tags: ['grades', 'assessment', 'legacy', 'v1'],
    body: `# Using the Grade Book (v1 — Legacy)

> **Note:** This article describes the v1 grade book. The current grade book is documented separately.

## Accessing the Grade Book

In platform v1, the grade book was a standalone page accessible from the left-hand navigation under **Teaching > Grade Book**.

## Viewing Scores

The grade book displayed a spreadsheet-style grid with learners as rows and assessments as columns.

\`\`\`
Grade Book Layout (v1):
  Columns: Learner Name | Email | Quiz 1 | Quiz 2 | Final | Total
  Rows:    One per enrolled learner
\`\`\`

## Manual Grade Override

To override an automatically assigned grade:

1. Click the score cell you want to change
2. Type the new score
3. Press **Enter** to confirm
4. Optionally add a note explaining the override

> **Caution:** Manual overrides in v1 were permanent and could not be reverted after saving. In v2, all overrides are logged and reversible from the audit trail.

## Exporting Grades

Use **Export > CSV** to download the full grade book as a spreadsheet. The export includes all overrides and timestamps.`,
  },
]
