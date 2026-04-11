export interface BlogArticle {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  tags: string[];
  body: string;
}

export const blogArticles: BlogArticle[] = [
  {
    title: 'Introducing Block-Based Authoring',
    slug: 'introducing-block-based-authoring',
    excerpt: 'Learn how our new block-based authoring system makes content creation faster and more flexible than ever.',
    date: '2025-01-15',
    tags: ['authoring', 'features'],
    body: '<p>Block-based authoring is a revolutionary approach to content creation that lets you compose rich learning experiences from modular, reusable blocks. Each block can be independently versioned, previewed, and reordered—giving authors unmatched flexibility.</p><p>With the new authoring interface, you can drag and drop blocks, apply templates, and publish with a single click. The platform handles the rest.</p>',
  },
  {
    title: 'Static-First Delivery: Why It Matters',
    slug: 'static-first-delivery',
    excerpt: 'Discover how our static-first approach delivers blazing-fast learning content with zero runtime overhead.',
    date: '2025-01-22',
    tags: ['performance', 'architecture'],
    body: '<p>Static-first delivery means your learners receive pre-rendered HTML rather than waiting for a server to assemble pages on demand. This translates directly into faster load times, better offline support, and lower infrastructure costs.</p><p>Our build pipeline generates optimised static bundles for every content version, ensuring learners always get the fastest possible experience.</p>',
  },
  {
    title: 'Evergreen Platform: Keeping Content Up to Date',
    slug: 'evergreen-platform',
    excerpt: 'Explore the evergreen strategy that keeps your LMS content accurate and relevant without manual effort.',
    date: '2025-02-03',
    tags: ['content', 'strategy'],
    body: '<p>An evergreen platform automatically flags outdated content, suggests refreshes, and tracks version history so nothing falls through the cracks. Authors receive timely notifications when their material approaches its review date.</p><p>Combined with our block-based model, updates propagate instantly across all courses that share a given block.</p>',
  },
  {
    title: 'Getting Started with the Knowledge Base',
    slug: 'getting-started-kb',
    excerpt: 'A quick-start guide to navigating and contributing to the LMS Platform Knowledge Base.',
    date: '2025-02-18',
    tags: ['guide', 'kb'],
    body: '<p>The Knowledge Base is your single source of truth for everything related to the LMS Platform. Whether you are an editor crafting new courses or a learner seeking help, the KB has you covered.</p><p>Use the audience filter to narrow articles to your role, and the version badge to confirm you are reading docs for the release your organisation has deployed.</p>',
  },
];